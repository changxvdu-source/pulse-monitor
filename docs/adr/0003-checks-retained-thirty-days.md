# Raw Checks are kept for thirty days, then replaced by Hourly Summaries

Charts and availability need history, but a year of raw Checks per Monitor is about 100k rows and will make the dashboard scan the fact table. After thirty days, Pulse discards raw Checks and keeps Hourly Summaries.

Keeping every Check forever was rejected: the disk would survive longer than the query time. Keeping only seven days with no summaries was rejected: a 30-day availability number would have nothing to stand on.

This is a product promise, not just a cleanup job. Changing it later either means backfilling data we no longer have, or showing a gap.
