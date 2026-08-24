# Pulse has one Operator, not open registration

This is a portfolio product that should look operated-in-production, not a multi-tenant SaaS. Visitors may see a public status page; only one Operator logs in and manages Monitors.

Open registration was rejected: it would force tenancy, abuse limits, and a permissions model that does not change the resume story. A single-operator control plane plus a public status page is enough to show auth, ops, and a real product surface.

Reversing this later means introducing tenancy on every Monitor, Check, Incident, and notification path.
