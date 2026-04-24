---
phase: 0
slug: intrusioniq-ui
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-24
---

# Phase 0 - UI Design Contract

> Visual and interaction contract for the IntrusionIQ frontend. Generated from repo context, README, and existing UI implementation.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | Ionicons |
| Font | IBM Plex Sans + IBM Plex Mono |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 16px | Default element spacing |
| lg | 24px | Section padding |
| xl | 32px | Layout gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions: none

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.2 |
| Heading | 22px | 600 | 1.2 |
| Display | 32px | 700 | 1.05 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #07111b | Page background, deep surfaces |
| Secondary (30%) | #0f1b2d | Sidebar, cards, panels, table rows |
| Accent (10%) | #35d3ff | Primary CTA, live status, active nav, chart highlight, focus ring |
| Destructive | #ff5a67 | Destructive actions only |

Accent reserved for: primary CTA button, live API status, selected navigation state, active chart segment, focus ring, and loading/progress emphasis.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | Analyze CSV |
| Empty state heading | No traffic loaded |
| Empty state body | Upload a CICIDS2017 CSV to inspect benign vs attack flows, model confidence, and attack breakdowns. |
| Error state | Upload failed. Check that the file is a CSV with all 66 required flow features, then try again. |
| Destructive confirmation | Clear dashboard: This will remove the current upload and prediction results from the dashboard. Continue? |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
