//! Typosquat detection module.
//!
//! Bundles the reference data a typosquat check needs — the lists of popular
//! package names an attacker is most likely to imitate ([`dataset`]) — two
//! independent signals for comparing a candidate name against them (the
//! edit-distance primitives in [`distance`] and the lookalike-character
//! checks in [`homoglyph`]) — and [`scanner::score_package`], which combines
//! both signals into a single scored result.

pub mod dataset;
pub mod distance;
pub mod homoglyph;
pub mod scanner;
