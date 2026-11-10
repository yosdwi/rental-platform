---
title: Core Rental Flow
type: flow
status: active
---

# Core Rental Flow

## Happy path demo

```text
Owner creates vehicle
  ↓
Customer opens storefront link
  ↓
Customer selects location and rental time
  ↓
System shows available vehicle and total price
  ↓
Customer submits booking
  ↓
Owner approves booking
  ↓
Owner confirms pickup
  ↓
RentalSession becomes Active
  ↓
Customer location source sends positions
  ↓
Owner sees active rental and last seen on map
  ↓
Vehicle enters geofence
  ↓
Owner receives contextual alert
  ↓
Owner contacts/acknowledges/permits event
  ↓
Owner confirms return and inspection
  ↓
Maintenance task is created if needed
  ↓
Vehicle becomes Ready again when cleared
```

## Customer screens

1. Storefront landing / location context.
2. Availability and date/time selection.
3. Vehicle detail with price, rules, deposit, documents, pickup.
4. Booking confirmation.
5. Rental status and support.

## Owner screens

1. Command center with action queue.
2. Rental session detail drawer.
3. Live map with active rentals.
4. Geofence builder and rule preview.
5. Return/inspection checklist.
6. Maintenance task and downtime.

## Alert contract

Every location/geofence alert must expose:

- vehicle;
- customer;
- rental session;
- zone and rule;
- event type: entered/exited;
- event time;
- last seen and location accuracy;
- status: new/acknowledged/resolved;
- next actions.
