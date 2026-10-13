//! Lookalike-character (homoglyph) checks for typosquat detection.
//!
//! Edit distance ([`super::distance`]) catches names that are a keystroke or
//! two away from a popular one. It does *not* catch a name that is visually
//! identical but built from different code points — `paypal` spelled with a
//! Cyrillic `а` (U+0430) instead of a Latin `a`, or `express` typed in
//! full-width Latin (`ｅｘｐｒｅｓｓ`). To a reader those look like the real
//! package; to a registry they are a brand-new name.
//!
//! This module is the second, independent signal: it maps known lookalike
//! ("homoglyph") characters back to their Latin equivalents with
//! [`normalize_homoglyphs`], then asks whether that normalised form is the
//! name of a popular package ([`homoglyph_impersonation`]). It shares nothing
//! with `distance.rs` — no edit-distance math, no thresholds — and fires only
//! when a substitution actually happened.
//!
//! The confusable table below is a hand-picked subset of the Unicode
//! consortium's `confusables.txt` (UTR #39), limited to single-character
//! lowercase Latin lookalikes that realistically show up in package names:
//! Cyrillic and Greek letters, Armenian letters, a few IPA/Latin-extended
//! forms, plus the full-width ASCII block handled as a contiguous range. It is
//! deliberately conservative — every entry is a character an attacker would
//! reach for, not an exhaustive Unicode confusable dump.

/// Maps a single character to its Latin equivalent if it is a known homoglyph,
/// otherwise returns it unchanged.
fn fold_homoglyph(c: char) -> char {
    // Full-width ASCII form (U+FF01..=U+FF5E) is a 1:1 shift of printable
    // ASCII (U+0021..=U+007E), so `ｅｘｐｒｅｓｓ` -> `express`, `ｌｏｄａｓｈ` -> `lodash`.
    if ('\u{FF01}'..='\u{FF5E}').contains(&c) {
        return char::from_u32(c as u32 - 0xFF01 + 0x21).unwrap_or(c);
    }

    match c {
        // Cyrillic letters that share a glyph with lowercase Latin.
        '\u{0430}' => 'a', // а CYRILLIC SMALL LETTER A
        '\u{0435}' => 'e', // е CYRILLIC SMALL LETTER IE
        '\u{043E}' => 'o', // о CYRILLIC SMALL LETTER O
        '\u{0440}' => 'p', // р CYRILLIC SMALL LETTER ER
        '\u{0441}' => 'c', // с CYRILLIC SMALL LETTER ES
        '\u{0443}' => 'y', // у CYRILLIC SMALL LETTER U
        '\u{0445}' => 'x', // х CYRILLIC SMALL LETTER HA
        '\u{0455}' => 's', // ѕ CYRILLIC SMALL LETTER DZE
        '\u{0456}' => 'i', // і CYRILLIC SMALL LETTER BYELORUSSIAN-UKRAINIAN I
        '\u{0458}' => 'j', // ј CYRILLIC SMALL LETTER JE
        '\u{04BB}' => 'h', // һ CYRILLIC SMALL LETTER SHHA
        '\u{04CF}' => 'l', // ӏ CYRILLIC SMALL LETTER PALOCHKA
        '\u{0501}' => 'd', // ԁ CYRILLIC SMALL LETTER KOMI DE
        '\u{051B}' => 'q', // ԛ CYRILLIC SMALL LETTER QA
        // Greek letters with Latin lookalikes.
        '\u{03BF}' => 'o', // ο GREEK SMALL LETTER OMICRON
        '\u{03B1}' => 'a', // α GREEK SMALL LETTER ALPHA
        '\u{03B9}' => 'i', // ι GREEK SMALL LETTER IOTA
        '\u{03BD}' => 'v', // ν GREEK SMALL LETTER NU
        '\u{03C1}' => 'p', // ρ GREEK SMALL LETTER RHO
        '\u{03C5}' => 'u', // υ GREEK SMALL LETTER UPSILON
        '\u{03BA}' => 'k', // κ GREEK SMALL LETTER KAPPA
        '\u{03C7}' => 'x', // χ GREEK SMALL LETTER CHI
        // Armenian letters with Latin lookalikes.
        '\u{0585}' => 'o', // օ ARMENIAN SMALL LETTER OH
        '\u{0570}' => 'h', // հ ARMENIAN SMALL LETTER HO
        '\u{057D}' => 's', // ս ARMENIAN SMALL LETTER SEH
        // Latin-extended / IPA forms that render as a plain Latin letter.
        '\u{0261}' => 'g', // ɡ LATIN SMALL LETTER SCRIPT G
        '\u{0131}' => 'i', // ı LATIN SMALL LETTER DOTLESS I
        other => other,
    }
}

/// Rewrites `candidate` with every known homoglyph replaced by its Latin
/// equivalent.
///
/// Characters that are not in the confusable table (including ordinary ASCII)
/// pass through untouched, so a name that never used a lookalike comes back
/// byte-for-byte identical. This is a pure text transform — it does not lower-
/// case, strip, or otherwise normalise beyond the homoglyph mapping.
pub fn normalize_homoglyphs(candidate: &str) -> String {
    candidate.chars().map(fold_homoglyph).collect()
}

/// Reports whether `candidate` looks like a homoglyph impersonation of a
/// popular package.
///
/// Returns `Some(name)` when *both* hold:
///
/// 1. [`normalize_homoglyphs`] changed `candidate` — at least one lookalike
///    character was actually substituted, and
/// 2. the normalised form exactly matches an entry in `dataset` (in practice
///    the combined list from
///    [`load_popular_packages`](super::dataset::load_popular_packages)).
///
/// A pure-ASCII name is never flagged even if it is itself a popular package,
/// because condition 1 fails: nothing was disguised. Returns `None` otherwise.
/// On a match the earliest `dataset` entry wins, mirroring
/// [`nearest_match`](super::distance::nearest_match).
pub fn homoglyph_impersonation(candidate: &str, dataset: &[String]) -> Option<String> {
    let normalized = normalize_homoglyphs(candidate);
    if normalized == candidate {
        return None;
    }
    dataset.iter().find(|name| *name == &normalized).cloned()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::typosquat::dataset::load_popular_packages;

    #[test]
    fn normalize_is_identity_for_plain_ascii() {
        assert_eq!(normalize_homoglyphs("react"), "react");
        assert_eq!(normalize_homoglyphs("@angular/core"), "@angular/core");
        assert_eq!(normalize_homoglyphs(""), "");
    }

    #[test]
    fn normalize_maps_cyrillic_lookalikes_to_latin() {
        // "react" with a Cyrillic 'а' (U+0430) in place of the Latin 'a'.
        assert_eq!(normalize_homoglyphs("re\u{0430}ct"), "react");
        // "lodash" with Cyrillic 'о' (U+043E) and 'а' (U+0430).
        assert_eq!(normalize_homoglyphs("l\u{043E}d\u{0430}sh"), "lodash");
    }

    #[test]
    fn normalize_maps_fullwidth_latin_to_ascii() {
        // "express" typed entirely in the full-width Latin block (U+FF45 ...).
        assert_eq!(
            normalize_homoglyphs("\u{FF45}\u{FF58}\u{FF50}\u{FF52}\u{FF45}\u{FF53}\u{FF53}"),
            "express"
        );
    }

    #[test]
    fn normalize_maps_greek_lookalikes_to_latin() {
        // "commander" with its first 'o' swapped for a Greek omicron 'ο' (U+03BF).
        assert_eq!(normalize_homoglyphs("c\u{03BF}mmander"), "commander");
    }

    #[test]
    fn impersonation_flags_cyrillic_a_in_npm_package() {
        let dataset = load_popular_packages();
        // "react" (npm) with a Cyrillic 'а' (U+0430).
        assert_eq!(
            homoglyph_impersonation("re\u{0430}ct", &dataset).as_deref(),
            Some("react")
        );
    }

    #[test]
    fn impersonation_flags_fullwidth_pypi_package() {
        let dataset = load_popular_packages();
        // "requests" (PyPI) written in full-width Latin.
        let fullwidth = "\u{FF52}\u{FF45}\u{FF51}\u{FF55}\u{FF45}\u{FF53}\u{FF54}\u{FF53}";
        assert_eq!(
            homoglyph_impersonation(fullwidth, &dataset).as_deref(),
            Some("requests")
        );
    }

    #[test]
    fn impersonation_flags_greek_omicron_in_npm_package() {
        let dataset = load_popular_packages();
        // "lodash" (npm) with its 'o' swapped for a Greek omicron 'ο' (U+03BF).
        assert_eq!(
            homoglyph_impersonation("l\u{03BF}dash", &dataset).as_deref(),
            Some("lodash")
        );
    }

    #[test]
    fn impersonation_ignores_plain_ascii_popular_package() {
        let dataset = load_popular_packages();
        // "react" spelled correctly is the real package, not an impersonation.
        assert_eq!(homoglyph_impersonation("react", &dataset), None);
    }

    #[test]
    fn impersonation_ignores_homoglyph_name_that_is_not_popular() {
        let dataset = load_popular_packages();
        // Normalises to "reactxyzzy", which is not in the dataset.
        assert_eq!(homoglyph_impersonation("re\u{0430}ctxyzzy", &dataset), None);
    }
}
