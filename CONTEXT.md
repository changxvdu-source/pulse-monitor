# Pulse

Pulse watches HTTP or HTTPS URLs and records whether they are reachable. It is operated by one person and shown as a portfolio piece. All times are UTC.

## Language

**Pulse**:
The product. An HTTP(S) uptime monitor.
_Avoid_: Watchpost, the platform, the app, the website

**Operator**:
The single person who authenticates and manages Monitors.
_Avoid_: User, admin, tenant, customer, owner, account

**Visitor**:
Anyone who is not the Operator. A Visitor never manages Monitors.
_Avoid_: public user, anonymous user, guest

**Monitor**:
A named HTTP or HTTPS URL under watch. The name is required and is what the Status Page shows as the title. The URL is unique in Pulse. A Monitor is either running or Paused, and if running it is Up or Down. The Operator may mark it public.
_Avoid_: check, job, target, site, website

**Public Monitor**:
A Monitor the Visitor can see on the Status Page.
_Avoid_: listed monitor, shared monitor, published monitor

**Paused**:
A Monitor that is not receiving Checks. Pausing closes any open Incident.
_Avoid_: disabled, muted, archived, stopped

**Check**:
One HTTP GET against a Monitor, recorded as successful or failed.
_Avoid_: probe, ping, poll, sample, request

**Successful Check**:
A Check whose first response is HTTP 2xx or 3xx within ten seconds. Redirects are not followed; a 3xx is already success.
_Avoid_: up check, pass, healthy response

**Failed Check**:
A Check that is not a Successful Check: timeout, network error, or any other status code.
_Avoid_: down check, error, outage

**Incident**:
A period that starts after three consecutive Failed Checks and ends after three consecutive Successful Checks.
_Avoid_: outage, downtime, alert, failure, event

**Up**:
The state of a running Monitor when no Incident is open.
_Avoid_: online, healthy, available, green

**Down**:
The state of a running Monitor when an Incident is open. A single Failed Check does not make a Monitor Down.
_Avoid_: offline, unhealthy, unavailable, red

**Status Page**:
The single public page a Visitor can open. For each Public Monitor it shows current Up/Down/Paused, a response-time chart, recent Incidents, and 90-day Availability.
_Avoid_: public dashboard, status board, public view

**Availability**:
The fraction of time a Monitor was Up over the last 90 days. Time spent Paused does not count.
_Avoid_: uptime, SLA, success rate

**Notification**:
An email to the Operator when an Incident opens and when it closes.
_Avoid_: alert, page, message, channel, webhook

**Hourly Summary**:
Per-hour totals for a Monitor (Successful Checks, Failed Checks, average response time) after raw Checks older than thirty days are discarded.
_Avoid_: aggregate, downsample, metric, rollup
