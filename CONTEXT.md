# Outreach Tool

A personal prospecting tool for finding Lagos businesses without proper websites and pitching them web and mobile development services.

## Language

**Lead**:
A business discovered via Google Places that lacks a proper website. Leads move through a qualification and outreach pipeline.
_Avoid_: Prospect, contact, target

**Approved Lead**:
A lead the user has reviewed and decided to contact. Status indicates intent, not readiness — email may be added later.
_Avoid_: Qualified lead, ready to send

**Outreach**:
Any contact attempt with a lead — email or phone call. A lead may receive both.
_Avoid_: Campaign, blast

**Contacted**:
Any lead that has received outreach (emailed or phone-called). Does not imply the lead replied.
_Avoid_: Sent, reached

**Replied**:
A lead responded to outreach. Status is neutral — does not distinguish positive from negative replies.
_Avoid_: Converted, interested, closed

**Note**:
An immutable, timestamped activity log entry attached to a lead. Used to record calls, conversations, and follow-up actions.
_Avoid_: Comment, memo, log

**Template**:
A reusable email body with placeholders tied to a specific business type. Selected per-lead at send time.
_Avoid_: Script, boilerplate, preset

**Business Type**:
A Google Places category the user prospects within (e.g. restaurant, salon, clinic). Used for both fetching and template mapping.
_Avoid_: Vertical, niche, industry

**Social URL**:
A Facebook or Instagram page URL returned by the Places API. Not a real website — these businesses are kept as leads.
_Avoid_: Online presence, web presence
