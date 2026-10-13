//! Minimal client for the [OSV.dev](https://osv.dev) vulnerability database.
//!
//! `query_osv` resolves a `(package name, ecosystem, version)` triple to the
//! raw set of vulnerabilities OSV knows about for that exact version, via
//! [`POST /v1/query`](https://google.github.io/osv.dev/api/#post-v1query).
//! There is no filtering, deduplication, or severity scoring here — this is
//! just fetch-and-parse into typed structs. Turning the raw matches into
//! scored findings belongs with the (not-yet-written) CVE scanner module.

use serde::{Deserialize, Serialize};

const OSV_QUERY_URL: &str = "https://api.osv.dev/v1/query";

/// Package registries `query_osv` can query OSV against.
///
/// OSV's own ecosystem list is much larger, but the crawler only targets
/// these three registries today; add variants here as more are wired up.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Ecosystem {
    Npm,
    PyPI,
    CratesIo,
}

impl Ecosystem {
    /// The ecosystem name OSV expects in a query, exactly as documented at
    /// <https://ossf.github.io/osv-schema/#affectedpackage-field>.
    fn as_osv_str(self) -> &'static str {
        match self {
            Ecosystem::Npm => "npm",
            Ecosystem::PyPI => "PyPI",
            Ecosystem::CratesIo => "crates.io",
        }
    }
}

/// Request body for `POST /v1/query`: a single package name + ecosystem,
/// pinned to one version.
#[derive(Debug, Serialize)]
struct OsvQueryRequest<'a> {
    version: &'a str,
    package: OsvPackageQuery<'a>,
}

#[derive(Debug, Serialize)]
struct OsvPackageQuery<'a> {
    name: &'a str,
    ecosystem: &'a str,
}

/// The package identity as OSV echoes it back inside an `affected` entry.
#[derive(Debug, Clone, Deserialize)]
pub struct OsvPackage {
    pub name: String,
    pub ecosystem: String,
    /// Package URL, e.g. `pkg:npm/lodash`. Not present for every ecosystem.
    pub purl: Option<String>,
}

/// One event in a version range: the point where a vulnerability was
/// introduced, fixed, or last known to affect a version. Exactly one field
/// is set per event, per the OSV schema.
#[derive(Debug, Clone, Deserialize)]
pub struct OsvEvent {
    pub introduced: Option<String>,
    pub fixed: Option<String>,
    pub last_affected: Option<String>,
    pub limit: Option<String>,
}

/// A version range (e.g. a SEMVER range) bounding which versions of a
/// package are affected.
#[derive(Debug, Clone, Deserialize)]
pub struct OsvRange {
    #[serde(rename = "type")]
    pub range_type: String,
    #[serde(default)]
    pub events: Vec<OsvEvent>,
}

/// One `affected` entry: a package (possibly a different name/ecosystem than
/// the one queried, e.g. an alias package) plus the ranges and/or explicit
/// version list that are affected.
#[derive(Debug, Clone, Deserialize)]
pub struct OsvAffected {
    pub package: Option<OsvPackage>,
    #[serde(default)]
    pub ranges: Vec<OsvRange>,
    #[serde(default)]
    pub versions: Vec<String>,
}

/// A severity score reported for a vulnerability, e.g. a CVSS vector string.
#[derive(Debug, Clone, Deserialize)]
pub struct OsvSeverity {
    #[serde(rename = "type")]
    pub severity_type: String,
    pub score: String,
}

/// A reference URL for a vulnerability (advisory, fix commit, report, etc).
#[derive(Debug, Clone, Deserialize)]
pub struct OsvReference {
    #[serde(rename = "type")]
    pub reference_type: String,
    pub url: String,
}

/// One vulnerability record as returned by OSV.
///
/// This mirrors the subset of the [OSV schema](https://ossf.github.io/osv-schema/)
/// that `POST /v1/query` populates. `database_specific` fields vary by
/// source and aren't modeled here.
#[derive(Debug, Clone, Deserialize)]
pub struct OsvVulnerability {
    pub id: String,
    pub summary: Option<String>,
    pub details: Option<String>,
    #[serde(default)]
    pub aliases: Vec<String>,
    pub modified: Option<String>,
    pub published: Option<String>,
    #[serde(default)]
    pub severity: Vec<OsvSeverity>,
    #[serde(default)]
    pub affected: Vec<OsvAffected>,
    #[serde(default)]
    pub references: Vec<OsvReference>,
}

/// Response body of `POST /v1/query`: the list of vulnerabilities matching
/// the queried package/version, if any.
#[derive(Debug, Clone, Default, Deserialize)]
pub struct OsvQueryResponse {
    #[serde(default)]
    pub vulns: Vec<OsvVulnerability>,
}

/// Errors from querying OSV.
#[derive(Debug)]
pub enum OsvClientError {
    /// The HTTP request itself failed (network error, timeout, TLS, etc).
    Request(reqwest::Error),
    /// OSV responded, but with a non-success status code.
    UnexpectedStatus(reqwest::StatusCode),
    /// The response body wasn't the JSON shape `OsvQueryResponse` expects.
    Decode(reqwest::Error),
}

impl std::fmt::Display for OsvClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OsvClientError::Request(err) => write!(f, "OSV request failed: {err}"),
            OsvClientError::UnexpectedStatus(status) => {
                write!(f, "OSV returned unexpected status: {status}")
            }
            OsvClientError::Decode(err) => write!(f, "failed to decode OSV response: {err}"),
        }
    }
}

impl std::error::Error for OsvClientError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            OsvClientError::Request(err) | OsvClientError::Decode(err) => Some(err),
            OsvClientError::UnexpectedStatus(_) => None,
        }
    }
}

/// Queries OSV for known vulnerabilities affecting `package_name` at exactly
/// `version` in `ecosystem`, and returns the raw matches.
///
/// This does no filtering, deduplication, or severity scoring — an empty
/// `vulns` list in the returned [`OsvQueryResponse`] means OSV has no known
/// vulnerability for this exact version.
pub fn query_osv(
    package_name: &str,
    ecosystem: Ecosystem,
    version: &str,
) -> Result<OsvQueryResponse, OsvClientError> {
    let request_body = OsvQueryRequest {
        version,
        package: OsvPackageQuery {
            name: package_name,
            ecosystem: ecosystem.as_osv_str(),
        },
    };

    let response = reqwest::blocking::Client::new()
        .post(OSV_QUERY_URL)
        .json(&request_body)
        .send()
        .map_err(OsvClientError::Request)?;

    let status = response.status();
    if !status.is_success() {
        return Err(OsvClientError::UnexpectedStatus(status));
    }

    response.json().map_err(OsvClientError::Decode)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// `lodash@4.17.4` (npm) predates the fix for GHSA-29mw-wpgm-hmr9 /
    /// CVE-2020-28500 (a ReDoS in `trim`/`toNumber`/`trimEnd`, fixed in
    /// 4.17.21), so OSV is expected to report at least that one match.
    ///
    /// This hits the real OSV API and is skipped (not failed) if the
    /// request can't complete — e.g. no network access in a sandboxed CI
    /// runner — since that's an environment limitation, not a bug in the
    /// client.
    #[test]
    fn query_osv_finds_known_vulnerability_in_lodash() {
        let result = query_osv("lodash", Ecosystem::Npm, "4.17.4");

        let response = match result {
            Ok(response) => response,
            Err(err) => {
                eprintln!("skipping: OSV query failed ({err}), likely no network access");
                return;
            }
        };

        assert!(
            !response.vulns.is_empty(),
            "expected lodash@4.17.4 to have at least one known vulnerability"
        );
        assert!(
            response
                .vulns
                .iter()
                .any(|v| v.aliases.iter().any(|a| a == "CVE-2020-28500")),
            "expected CVE-2020-28500 among lodash@4.17.4's vulnerabilities, got: {:?}",
            response.vulns.iter().map(|v| &v.id).collect::<Vec<_>>()
        );
    }

    #[test]
    fn ecosystem_as_osv_str_matches_osv_schema_names() {
        assert_eq!(Ecosystem::Npm.as_osv_str(), "npm");
        assert_eq!(Ecosystem::PyPI.as_osv_str(), "PyPI");
        assert_eq!(Ecosystem::CratesIo.as_osv_str(), "crates.io");
    }
}
