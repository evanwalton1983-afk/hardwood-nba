# Changelog

## 1.1.0 (2026-10-23)
- Added a fairPrice module with four ways to take the vig out of a quote: Shin, multiplicative, additive and power.
- New Settings: Fair price method (default Shin) and EV gate (default Worst case).
- Worst case EV uses the lowest fair probability across all four methods for the side being bet, and drives every EV flag, bar and sort.
- The method is shown next to fair prices on the slate card, game sheet, board and ladders. Hover or long press an EV on the board for the EV under each method.
- Logged bets also record the method, the gated EV and the EV under each method.
- Closing line value and the shopping split still use the multiplicative consensus, so they compare like with like against saved price history.
- Unit tests in tests/fairPrice.test.js (run: node --test tests/fairPrice.test.js).
- Because Shin and the worst case gate are the new defaults, displayed fair prices and EV will differ slightly from 1.0.1. Pick Multiplicative and Follow the fair price method to reproduce 1.0.1.
