# The Operator is created from environment variables

There is no registration. On boot, Pulse creates the Operator if missing, using `OPERATOR_EMAIL` and `OPERATOR_PASSWORD`.

A first-run setup screen was rejected: it is extra UI that only runs once and is awkward under Docker. Inserting a row by hand was rejected: it cannot be demoed or rebuilt cleanly.

The password lives in the host environment, not in the repo. Changing this later means adding a signup or invite path the rest of the product was built without.
