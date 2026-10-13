//! Manual CLI for the combined typosquat scorer.
//!
//! Usage: `scan <package-name>` — scores the given name against the bundled
//! popular-package dataset with both the edit-distance and homoglyph signals
//! and prints the result.

use std::env;
use std::process::ExitCode;

use deprader::typosquat::scanner::score_package;

fn main() -> ExitCode {
    let name = match env::args().nth(1) {
        Some(name) => name,
        None => {
            eprintln!("usage: scan <package-name>");
            return ExitCode::FAILURE;
        }
    };

    println!("{}", score_package(&name));
    ExitCode::SUCCESS
}
