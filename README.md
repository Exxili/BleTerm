# BleTerm

An opinionated desktop app (Electron + React + Vite) for talking to **embedded devices over Bluetooth Low Energy (BLE)**.  
It focuses on a “terminal-like” workflow: **send text** to a write characteristic and **listen** to notify/indicate characteristics.

---

## Features (MVP)

- Discover & connect to a BLE device by name/UUID
- Send text payloads to a configurable **write** characteristic
- Subscribe to **notify/indicate** characteristics and stream incoming data
- Cross-platform runtime with Electron (macOS, Windows, Linux)

> Status: Early development. APIs/UX may change.

---

## Tech stack

- **Electron** (main & preload)
- **React + Vite** (renderer UI)
- **TypeScript**
- **BLE** via `@abandonware/noble` (Node BLE stack)

---

## Getting started

```bash
# install
npm i

# dev (starts Vite + Electron)
npm run dev
```
