# University directory

- Ranking edition: **2026**, U.S. News National Universities, ranks 1–200 inclusive. Not described as the latest edition. Liberal arts colleges excluded. Ties retained: 207 institutions.
- Ranking republication: https://qyliuxue.com/rank/32898543582171136.html
- Cross-check / four omitted tied #169 entries (Duquesne, Florida A&M, Louisiana State, Mercer): https://www.compassedu.hk/usnews?no=15
- Institutional names, control, city, state, links: NCES IPEDS https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip
- Cost data: NCES IPEDS https://nces.ed.gov/ipeds/datacenter/data/IC2023_AY.zip
- Variable definitions: https://nces.ed.gov/ipeds/datacenter/data/IC2023_AY_Dict.zip

Costs represent the **2023–24 full academic year**, published full-time first-time undergraduate out-of-state cost with on-campus living. Not a current quote, transfer-specific quote, international-specific quote, calendar-year cost, or net price after aid.

Computed total = CHG3AY3 (out-of-state tuition and required fees) + CHG4AY3 (books and supplies) + CHG5AY3 (on-campus food and housing) + CHG6AY3 (on-campus other expenses). Missing inputs produce null, never zero substitutes. International insurance, travel, visa expenses and program surcharges may be additional.

IPEDS UNITID is the join key. Name mismatches are explicitly mapped to the correct campus in build_directory.py; fuzzy matches are not accepted. The script expects downloaded snapshots in /workspace and produces dist/universities.json. Snapshot data is already included in that JSON.

Community records are fictional samples, clearly labeled. In unconfigured demo mode, user submissions are browser-local. Configured shared mode stores newly consented submissions in Supabase and displays them publicly after review; these remain self-reported, not verified admission records. Old local records are not uploaded. Language background is independent of domestic/international status; English native speakers skip test questions.
