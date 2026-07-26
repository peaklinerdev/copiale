# Frontend Development Instructions

## Context
Stack: React (Vite), TypeScript, Tailwind CSS, shadcn/ui.
Port: 8082 (local), HMR enabled.

## Key Pages
| Route | Component | Notes |
|-------|-----------|-------|
| `/` | `Home.tsx` | Offer listings with search + filters + pagination |
| `/create-offer` | `offer/CreateOfferPage.tsx` | 4-step wizard with payment methods modal |
| `/trade/:id` | `TradePage.tsx` | Trade details + Chat/Trade Logs tabs |
| `/account` | `my/MyAccountPage.tsx` | Profile + faucet |
| `/admin/*` | Admin section | Dashboard, trades, accounts, disputes, config |

## Key Components
| Component | File | Notes |
|-----------|------|-------|
| TradeChat | `components/Trade/TradeChat.tsx` | Real-time chat with Copiale logo background pattern |
| ChatSection | `components/Trade/ChatSection.tsx` | Wrapper that loads TradeChat when trade is ready |
| ChatInput | `components/Trade/ChatInput.tsx` | Message input + paperclip (file upload) |
| ChatHeader | `components/Trade/ChatHeader.tsx` | Counterparty name + stats + panel toggle |
| CounterpartyPanel | `components/Trade/CounterpartyPanel.tsx` | Expanded side panel with stats |
| MessageBubble | `components/Trade/MessageBubble.tsx` | Text + image attachments + seen state |
| EscrowDetailsPanel | `components/Trade/TradeStatusDisplay/EscrowDetailsPanel.tsx` | Compact sidebar + expandable |
| EscrowDetailsTab | `components/Trade/EscrowDetailsTab.tsx` | Full escrow data + transaction table in Trade Logs tab |
| TransactionTable | `components/Trade/TransactionTable.tsx` | Bare table (no chrome) for Trade Logs tab |
| TransactionHistory | `components/Trade/TradeStatusDisplay/TransactionHistory.tsx` | Compact sidebar version with "View all" |
| PaymentMethodsModal | `components/PaymentMethodsModal.tsx` | Manage saved payment methods |
| FilterBar | `components/Home/FilterBar.tsx` | Search + buy/sell + currency + sort filters |

## Tab Switcher (TradePage)
Main panel has `[Chat] [Trade Logs]` tabs:
- **Chat**: Real-time trade chat with status messages, file upload, Copiale logo background pattern
- **Trade Logs**: Full escrow data + bare transaction table (no collapse)
- Sidebar "View all" on TransactionHistory and "Expand" on EscrowDetailsPanel → switches to Trade Logs tab

## Form Auto-Submit Prevention
**CRITICAL**: All `<Button>` and `<button>` elements inside `<form>` MUST have `type="button"` explicitly set. shadcn `<Button>` defaults to `type="submit"` which causes form submission on any click inside a `<form>`.

## Payment Methods
- Users save payment methods via modal (account numbers, mobile money IDs)
- On offer creation, select from saved methods (checkboxes)
- Methods stored as `payment_methods` array on the offer
- `Offer` type includes `payment_methods?: string[]`

## Hooks
| Hook | File | Purpose |
|------|------|---------|
| useTradeChat | `hooks/useTradeChat.ts` | 5s polling, auto-seen, send message |
| useCounterpartyStats | `hooks/useCounterpartyStats.ts` | Trade stats for side panel |
| usePaymentMethods | `hooks/usePaymentMethods.ts` | CRUD saved payment methods |
| useOfferFiltering | `hooks/useOfferFiltering.ts` | Client-side search + filter + paginate |

## Chat File Upload
Files are read as base64 in the browser, POSTed as JSON to `/trades/:id/upload`, stored as data URLs in DB. Max 5MB per file. Accepted: PNG, JPEG, GIF, WebP, SVG, PDF.

## Workflow
- **Linting:** Run `npx tsc --noEmit` (there's no ESLint configured).
- **API Sync:** Types in `src/types/index.ts` and `src/api/index.ts` must match backend schemas.

## Blocked Operations
- Destructive git commands or force pushes
- Systemd service stops for `copiale-p2p-vite`
