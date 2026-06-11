import { useEffect, useRef, useState } from 'react';
import Container from '@/components/Shared/Container';
import { ChevronRight, Menu as MenuIcon, X } from 'lucide-react';

const sections = [
  { id: 'threat-modeling', title: 'Start Here: Threat Modeling' },
  { id: 'scam-types', title: 'The 7 Scam Types You Will Encounter' },
  { id: 'trade-checklist', title: 'Trade Safety Checklist' },
  { id: 'account-security', title: 'Account Security' },
  { id: 'digital-opsec', title: 'Digital Opsec: Network, Identity & Compartmentalization' },
  { id: 'on-chain-privacy', title: 'On-Chain Privacy and Crypto Hygiene' },
  { id: 'restricted-economies', title: 'Trading in Restricted Economies' },
  { id: 'if-things-go-wrong', title: 'If Things Go Wrong' },
  { id: 'sources', title: 'Sources' },
];

export default function BiblePage() {
  const [tocOpen, setTocOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setActiveSection(entry.target.id); break; }
        }
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.current.observe(el);
    }
    return () => observer.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  return (
    <Container className="max-w-4xl pb-20">
      {/* Title */}
      <div className="pt-10 pb-6 border-b border-[#2b3139] mb-8">
        <h1 className="text-2xl font-bold text-[#eaecef]">P2P Trading Safety &amp; Opsec Bible</h1>
        <p className="text-sm text-[#848e9c] mt-2 max-w-2xl">
          A comprehensive field manual compiled and maintained by Copiale for traders operating in restricted economies.
          Covers scam avoidance, counterparty safety, digital privacy, and threat modeling — drawn from EFF Surveillance
          Self-Defense, Privacy Guides, and industry research. All Copiale trades are escrow-protected; this guide covers
          what you need beyond the platform.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop TOC sidebar */}
        <nav className="hidden lg:block w-[220px] shrink-0">
          <div className="sticky top-24 space-y-0.5">
            <p className="text-[10px] text-[#5e6673] uppercase font-bold tracking-wider mb-3">Contents</p>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`block w-full text-left text-xs py-1.5 px-2 rounded-sm transition-colors ${
                  activeSection === s.id
                    ? 'text-[#FF6B00] bg-[#FF6B00]/5 font-medium'
                    : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-white/[0.03]'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile TOC toggle */}
        <div className="lg:hidden w-full mb-6">
          <button
            onClick={() => setTocOpen(!tocOpen)}
            className="flex items-center justify-between w-full bg-[#1e2329] border border-[#2b3139] rounded-sm px-4 py-2.5 text-sm text-[#eaecef]"
          >
            <span className="flex items-center gap-2">
              <MenuIcon size={14} className="text-[#848e9c]" />
              Table of Contents
            </span>
            {tocOpen ? <X size={14} className="text-[#848e9c]" /> : <ChevronRight size={14} className="text-[#848e9c]" />}
          </button>
          {tocOpen && (
            <div className="mt-1 bg-[#1e2329] border border-[#2b3139] rounded-sm p-2 space-y-0.5">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { scrollTo(s.id); setTocOpen(false); }}
                  className={`block w-full text-left text-xs py-2 px-3 rounded-sm ${
                    activeSection === s.id ? 'text-[#FF6B00] bg-[#FF6B00]/5' : 'text-[#848e9c]'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* 1. Threat Modeling */}
          <Section id="threat-modeling" title="1. Start Here: Threat Modeling">
            <P>Before choosing tools or tactics, you need to understand <strong>who you&apos;re protecting yourself from</strong> and <strong>what the stakes are</strong>. There is no universal setup that protects against every threat — trying to do everything at once leads to burnout and mistakes.</P>
            <P>The EFF&apos;s Surveillance Self-Defense framework asks five questions before anything else:</P>
            <Ul>
              <li><strong>What do I want to protect?</strong> Trade records, identity, wallet addresses, transaction history.</li>
              <li><strong>Who do I want to protect it from?</strong> Scammers, banks, exchange KYC databases, government agencies, ISPs, or all of the above.</li>
              <li><strong>How likely is the threat?</strong> A scammer in every trade is likely. A state-level investigation is not — but the cost if it happens may be high.</li>
              <li><strong>How bad are the consequences?</strong> Losing $50 vs. losing your bank account vs. criminal exposure are very different threat levels.</li>
              <li><strong>How much friction can you tolerate?</strong> The most secure setup is the one you&apos;ll actually use consistently.</li>
            </Ul>
            <H3>Threat landscape overview</H3>
            <Table>
              <thead><tr><Th>Threat</Th><Th>Frequency</Th><Th>Primary mitigation</Th></tr></thead>
              <tbody>
                <Tr><Td>Counterparty fraud</Td><Td>Very high</Td><Td>Trade hygiene, escrow discipline</Td></Tr>
                <Tr><Td>Platform KYC/IP exposure</Td><Td>Medium</Td><Td>VPN, separate identities <span className="text-[10px] text-[#FF6B00]">— Copiale does not require KYC</span></Td></Tr>
                <Tr><Td>On-chain tracing</Td><Td>Medium</Td><Td>Wallet hygiene, privacy coins</Td></Tr>
                <Tr><Td>State-level surveillance</Td><Td>Low (but high cost)</Td><Td>Tor, encryption, compartmentalization</Td></Tr>
                <Tr><Td>Social engineering</Td><Td>High</Td><Td>Zero trust of unsolicited contact</Td></Tr>
                <Tr><Td>Physical safety</Td><Td>Low–medium</Td><Td>No in-person meets, keep volumes private</Td></Tr>
              </tbody>
            </Table>
            <Callout>
              <strong>Core principle:</strong> Security is a process, not a product. The goal isn&apos;t perfect invisibility — it&apos;s raising the <strong>cost and effort of surveillance</strong> to the point where an adversary decides it&apos;s not worth it. — <em>EFF Surveillance Self-Defense</em>
            </Callout>
          </Section>

          {/* 2. Scam Types */}
          <Section id="scam-types" title="2. The 7 Scam Types You Will Encounter">
            <P>Scams are the most common threat on P2P platforms — and they&apos;re largely preventable once you know how each one works. Modern scam operations run as teams, not solo actors, using bots and coordinated social engineering.</P>
            <H3>1. Fake payment proof</H3>
            <P>Scammer sends a doctored screenshot of a bank transfer or confirmation message before any real payment clears. They pressure you to release crypto immediately based on the &quot;proof.&quot;</P>
            <H3>2. Chargeback / payment reversal</H3>
            <P>Buyer pays via a reversible method (PayPal, credit card, sometimes mobile money), receives crypto, then disputes the payment with their bank claiming it was unauthorized. You lose both the crypto and the fiat.</P>
            <H3>3. Man-in-the-middle (MITM)</H3>
            <P>A third party intercepts communication between buyer and seller — often impersonating one side — to redirect payment to their own account while the trade appears to proceed normally on both ends.</P>
            <H3>4. Triangulation scam</H3>
            <P>Scammer runs two trades simultaneously, using payment from one victim to pay another, collecting crypto from both while neither victim directly interacts with them. Can implicate innocent traders in fraud investigations.</P>
            <H3>5. Overpayment scam</H3>
            <P>Buyer &quot;accidentally&quot; sends more than the trade amount and asks you to refund the difference immediately. The original payment later reverses or bounces. You&apos;ve already sent both the crypto and the &quot;refund.&quot;</P>
            <H3>6. Impersonation</H3>
            <P>Scammer copies a reputable trader&apos;s profile name and avatar (e.g., <code className="text-[10px] bg-[#1e2329] px-1 py-0.5 rounded-sm">CryptoKing_1</code> vs. <code className="text-[10px] bg-[#1e2329] px-1 py-0.5 rounded-sm">CryptoKing1</code>), or poses as platform support staff requesting login credentials or off-platform payments. Real support never asks you to send funds through messages.</P>
            <H3>7. Off-platform redirect</H3>
            <P>Counterparty pushes to move communication to Telegram, WhatsApp, or email — removing escrow protection and platform dispute resolution, and making the trade unverifiable if anything goes wrong.</P>
            <Callout>
              <strong>Hard rule:</strong> Never release crypto until payment appears as settled funds in your actual bank or mobile money account — not as a screenshot, not as a notification, not as a &quot;pending&quot; balance. Screenshots of transfer receipts are trivially edited. Verify directly in your banking app.
            </Callout>
          </Section>

          {/* 3. Trade Safety Checklist */}
          <Section id="trade-checklist" title="3. Trade Safety Checklist">
            <H3>Before starting a trade</H3>
            <Ul>
              <li><strong>Check reputation depth, not just score.</strong> Traders with 1,000+ completed trades are significantly less likely to scam. Look at account age and whether recent reviews mention disputes. <span className="text-[10px] text-[#FF6B00]">— Copiale shows account age and reviews on every profile.</span></li>
              <li><strong>Match payment name to platform ID.</strong> The name on the incoming transfer must exactly match the verified name on the platform profile. Any discrepancy is a red flag — cancel and walk away.</li>
              <li><strong>Prefer non-reversible payment methods when selling.</strong> Instant rails like UPI (India), PIX (Brazil), PromptPay (Thailand), GCash (Philippines), and most mobile money systems settle immediately and cannot be charged back.</li>
              <li><strong>Start small with new counterparties.</strong> Even a high-reputation trader is unproven with you personally. Test with a smaller trade first.</li>
            </Ul>
            <H3>During the trade</H3>
            <Ul>
              <li><strong>Keep all communication on-platform.</strong> Platform chat is logged and admissible in disputes. Off-platform chats are not. If they ask to move to Telegram, decline.</li>
              <li><strong>Never cancel a trade after sending payment.</strong> Cancellation releases escrow back to the seller. If you&apos;ve already paid, open a dispute instead.</li>
              <li><strong>Screenshot everything</strong> — trade initiation, payment confirmation, all chat messages. These are your only evidence if a dispute arises.</li>
              <li><strong>Ignore artificial urgency.</strong> Scammers manufacture time pressure. A legitimate trader will wait for proper payment verification. &quot;The window is closing&quot; is a manipulation tactic, not a real constraint.</li>
            </Ul>
            <H3>Payment method risk tiers</H3>
            <Table>
              <thead><tr><Th>Method</Th><Th>Reversal risk</Th><Th>Notes</Th></tr></thead>
              <tbody>
                <Tr><Td>Mobile money (M-Pesa, etc.)</Td><Td>Low</Td><Td>Near-instant, typically irreversible once confirmed</Td></Tr>
                <Tr><Td>Local bank transfer</Td><Td>Medium</Td><Td>Can be recalled within hours at some banks; wait for full settlement</Td></Tr>
                <Tr><Td>PayPal / Venmo</Td><Td>High</Td><Td>Easily disputed; avoid as a seller</Td></Tr>
                <Tr><Td>Credit / debit card</Td><Td>High</Td><Td>Chargebacks available 60–120 days after transaction</Td></Tr>
                <Tr><Td>Cash in person</Td><Td>Low</Td><Td>Irreversible, but carries physical safety risks; meet in public</Td></Tr>
              </tbody>
            </Table>
          </Section>

          {/* 4. Account Security */}
          <Section id="account-security" title="4. Account Security">
            <P>Your trading account is a high-value target. Unlike a bank, most P2P platforms have limited recourse if your account is compromised and funds are moved.</P>
            <Ul>
              <li><strong>Use a hardware security key or authenticator app for 2FA — never SMS.</strong> SIM-swapping attacks are common and cheap for attackers. SMS 2FA provides almost no protection against targeted compromise.</li>
              <li><strong>Use a unique, long, random password for every platform.</strong> Use a password manager. Reused passwords are the single most common account compromise vector.</li>
              <li><strong>Create a dedicated email address for crypto platforms</strong> — one not used for anything else, not linked to your real name.</li>
              <li><strong>Never access trading accounts on shared devices or public Wi-Fi</strong> without a VPN. Keyloggers and network interception are real risks on shared hardware.</li>
              <li><strong>Enable withdrawal address whitelisting</strong> where available. This limits where funds can be sent even if your account is fully compromised.</li>
              <li><strong>Log out after each session</strong> on any device you don&apos;t fully control.</li>
            </Ul>
            <Callout>
              <strong>Phishing alert:</strong> Fake platform websites are a major attack vector. Scammers create lookalike domains (e.g., <code className="text-[10px] bg-[#1e2329] px-1 py-0.5 rounded-sm">binance-support.com</code>) and send emails claiming your account is restricted. Always access platforms via bookmarks or the official app — never via links in emails or messages.
            </Callout>
          </Section>

          {/* 5. Digital Opsec */}
          <Section id="digital-opsec" title="5. Digital Opsec: Network, Identity &amp; Compartmentalization">
            <P>Relevant to anyone in a jurisdiction where P2P trading is restricted, monitored, or where network surveillance is a concern.</P>
            <H3>VPNs: what they do and don&apos;t do</H3>
            <P>A VPN hides the content of your traffic from your ISP and local network, and masks your real IP from the platforms you connect to. It does <strong>not</strong> make you anonymous — your VPN provider can see your traffic and can be legally compelled to produce records.</P>
            <P>Choose a provider with a verified no-logs policy, independently audited, incorporated outside your jurisdiction.</P>
            <P><strong>Limitation:</strong> A VPN can hide <em>what</em> you&apos;re visiting from local observers, but cannot hide <em>that you&apos;re using a VPN</em> from your ISP. In countries with deep packet inspection (DPI), VPN use itself may be flagged. Use obfuscated protocols such as <strong>Shadowsocks</strong> or <strong>obfs4</strong> to make VPN traffic appear as normal HTTPS. — <em>EFF SSD / Privacy Guides</em></P>
            <H3>Tor: stronger anonymity, different tradeoffs</H3>
            <P>Tor routes traffic through multiple volunteer-operated relays, making it very difficult for any single observer to link your activity to your identity. It is slower than a VPN and unsuitable for latency-sensitive trading. For accessing research, forums, or communicating about your trades, Tor provides meaningfully stronger anonymity.</P>
            <P>Tor is also an effective censorship circumvention tool — traffic is difficult to block and trace, making it functional in many countries where direct platform access is blocked. <strong>Bridges and pluggable transports</strong> (obfs4, Shadowsocks, Meek) make Tor traffic look like regular HTTPS to DPI systems.</P>
            <H3>Key opsec practices</H3>
            <Ul>
              <li><strong>Compartmentalize identities.</strong> Your trading identity should be completely separate from your real-world identity and all other online accounts. Use a separate device, browser profile, or virtual machine where possible.</li>
              <li><strong>Use privacy-respecting communication.</strong> Signal for sensitive conversations. Telegram is not end-to-end encrypted by default (only in &quot;Secret Chats&quot;). Do not discuss trade details on WhatsApp or SMS.</li>
              <li><strong>Don&apos;t reuse usernames.</strong> A username used across multiple platforms can be cross-referenced to build a profile of you over time.</li>
              <li><strong>Minimize metadata leakage.</strong> Profile photos, writing style, time zone patterns from your active hours, and trade size patterns can all be used to identify you without ever breaking encryption.</li>
              <li><strong>Be skeptical of claimed anonymity.</strong> Layering VPN + Tor + privacy browser reduces exposure significantly but does not guarantee invisibility. Fingerprinting, traffic correlation, and endpoint vulnerabilities remain real attack surfaces.</li>
            </Ul>
            <H3>Tool capabilities at a glance</H3>
            <Table>
              <thead><tr><Th>Tool</Th><Th>Protects against</Th><Th>Does not protect against</Th></tr></thead>
              <tbody>
                <Tr><Td>VPN</Td><Td>ISP monitoring, local network snooping, basic IP logging</Td><Td>VPN provider logging, fingerprinting, platform account linkage</Td></Tr>
                <Tr><Td>Tor Browser</Td><Td>Traffic analysis, IP identification, censorship blocking</Td><Td>Account-level de-anonymization, slow speeds, endpoint compromise</Td></Tr>
                <Tr><Td>Signal</Td><Td>Message content interception</Td><Td>Device seizure, contact list exposure without screen lock</Td></Tr>
                <Tr><Td>Hardware 2FA key</Td><Td>Phishing, SIM-swap, account takeover</Td><Td>Physical theft, keyloggers on compromised device</Td></Tr>
                <Tr><Td>Password manager</Td><Td>Credential reuse, weak passwords, phishing</Td><Td>Master password compromise, device seizure</Td></Tr>
              </tbody>
            </Table>
          </Section>

          {/* 6. On-Chain Privacy */}
          <Section id="on-chain-privacy" title="6. On-Chain Privacy and Crypto Hygiene">
            <P><strong>Bitcoin is not private.</strong> Every transaction is permanently public. Address clustering, behavioral analysis, and blockchain analytics tools (operated by companies like Chainalysis) can link addresses to real identities — especially if you&apos;ve ever used the same wallet with a KYC exchange.</P>
            <H3>Wallet hygiene (all chains)</H3>
            <Ul>
              <li><strong>Never reuse addresses.</strong> A fresh address per transaction makes clustering attacks significantly harder.</li>
              <li><strong>Do not combine coins from different sources</strong> in a single transaction — this links those histories together permanently and visibly.</li>
              <li><strong>Use self-custody wallets</strong> for holding. Coins on an exchange are visible to and controlled by the exchange.</li>
              <li><strong>Vary timing and amounts</strong> when converting between assets. Sending exactly the same amount you received minutes earlier is trivially traceable regardless of which coins you used.</li>
            </Ul>
            <H3>Privacy coins</H3>
            <P>Privacy-preserving cryptocurrencies like <strong>Monero (XMR)</strong> hide transaction sender, recipient, and amount by default at the protocol level — using ring signatures, stealth addresses, and RingCT. This is fundamentally different from Bitcoin, where privacy requires deliberate, technically demanding extra steps.</P>
            <Callout>
              <strong>Realistic assessment:</strong> Monero is the strongest contender for financial privacy, but its claims have not been definitively proven under all adversary models. The IRS paid over $1.25 million to companies to develop Monero tracing tools. Current evidence suggests these tools assist <em>targeted</em> investigations rather than enabling mass surveillance — treat privacy coins as strong protection, not absolute protection. — <em>Privacy Guides</em>
            </Callout>
            <H3>Acquiring crypto with less exposure</H3>
            <P>P2P marketplaces are one of the best options for acquiring crypto without going through a centralized KYC exchange. If you do use a KYC exchange and want to reduce your on-chain trail afterward: acquire Monero, withdraw to self-custody, and use that as your base — rather than attempting to obscure Bitcoin transactions after the fact. <span className="text-[10px] text-[#FF6B00]">— Copiale is a P2P marketplace; no KYC exchange is required to trade here.</span></P>
            <P>If you go this route, purchase Monero at different times and in different amounts than where you plan to spend it. A $5,000 purchase followed by a $5,000 spend an hour later can be correlated by an outside observer regardless of the path the coins took.</P>
          </Section>

          {/* 7. Restricted Economies */}
          <Section id="restricted-economies" title="7. Trading in Restricted Economies">
            <P>P2P has become the primary crypto on-ramp in countries where exchange access is restricted or local banking doesn&apos;t integrate with international platforms. Countries like Nigeria, Ethiopia, Venezuela, Iran, and others consistently show high P2P volumes precisely because direct access is blocked or unreliable.</P>
            <H3>Know your regulatory environment</H3>
            <Ul>
              <li><strong>Understand what is and isn&apos;t legal in your jurisdiction.</strong> In many countries, holding crypto is legal but operating as an unlicensed exchange is not. Volume thresholds matter. Know where the legal line is before you cross it.</li>
              <li><strong>Bank account freezes are a real risk.</strong> In countries like Nigeria, accounts of active P2P traders have been frozen after being flagged by AML systems. Document every trade meticulously — payment purpose, counterparty details, trade receipts.</li>
              <li><strong>Avoid patterns that trigger AML flags.</strong> Regular large round-number transfers to and from multiple parties in rapid succession is a classic trigger pattern. Vary timing, keep records, and avoid operating in ways that look like an unlicensed exchange.</li>
            </Ul>
            <H3>Accessing blocked platforms</H3>
            <P>In jurisdictions where P2P platforms are blocked, Tor and obfuscated VPNs are the standard circumvention approach. Tor is specifically designed to resist blocking and has been used effectively in high-censorship environments including China, Iran, and Russia. Bridges and pluggable transports (obfs4, Shadowsocks) disguise Tor traffic as regular HTTPS against deep packet inspection. — <em>EFF SSD / Privacy Guides</em></P>
            <H3>If your bank freezes your account</H3>
            <Ul>
              <li>Contact your bank&apos;s compliance department immediately and request a formal written explanation.</li>
              <li>Provide comprehensive documentation: trade receipts, platform communication logs, and proof of the digital asset&apos;s origin.</li>
              <li>If the freeze relates to an AML flag from a counterparty, seek legal counsel specializing in digital finance — this is difficult to resolve alone.</li>
              <li>Ensure all incoming transfers use your exact platform-verified name — name mismatches are a primary freeze trigger.</li>
            </Ul>
          </Section>

          {/* 8. If Things Go Wrong */}
          <Section id="if-things-go-wrong" title="8. If Things Go Wrong">
            <H3>If you&apos;ve been scammed</H3>
            <Ul>
              <li><strong>Do not release escrow under any pressure</strong> — open a dispute through the platform&apos;s formal channel immediately. Platforms with escrow can hold funds during investigation.</li>
              <li>Gather all evidence: screenshots of chat, payment records, timestamps, the counterparty&apos;s profile URL.</li>
              <li>Report to the platform, not just to the counterparty. Moderators review documented evidence — their decision is typically final.</li>
              <li>Report to your local cybercrime unit if the amount is significant. Many jurisdictions now have dedicated crypto fraud units.</li>
            </Ul>
            <H3>If your account is compromised</H3>
            <Ul>
              <li>Immediately revoke all active sessions via the platform&apos;s security settings.</li>
              <li>Change your password and 2FA from a clean, uncompromised device.</li>
              <li>Transfer remaining crypto to a fresh self-custody wallet address that has never been used before.</li>
              <li>Report to platform support with details of the intrusion.</li>
            </Ul>
            <Callout>
              <strong>Never</strong> send funds to anyone claiming to be platform support, law enforcement, or a &quot;recovery agent&quot; who contacts you after a loss. These are all secondary scams. Legitimate recovery happens through official dispute channels — no fees required upfront, ever.
            </Callout>
          </Section>

          {/* Sources */}
          <Section id="sources" title="Sources">
            <ul className="space-y-1">
              <li><Link href="https://ssd.eff.org">EFF Surveillance Self-Defense</Link> — threat modeling, digital security planning, tool guidance</li>
              <li><Link href="https://www.privacyguides.org/en/basics/common-threats/">Privacy Guides — Common Threats</Link> — anonymity vs. privacy, surveillance models</li>
              <li><Link href="https://www.privacyguides.org/en/advanced/payments/">Privacy Guides — Private Payments</Link> — cryptocurrency acquisition, Monero, wallet hygiene</li>
              <li><Link href="https://chaingain.io/p2p-crypto-trading-safety-guide/">ChainGain — P2P Trading Safety Guide 2026</Link> — scam types, payment method risk tiers, trade checklist</li>
              <li><Link href="https://cointelegraph.com/learn/articles/p2p-crypto-scams-how-to-stay-safe">CoinTelegraph — P2P Crypto Scams</Link> — scam mechanics and avoidance strategies</li>
              <li><Link href="https://bingx.com/en/learn/article/top-p2p-crypto-scams-and-how-to-avoid-them">BingX — Top P2P Scams 2026</Link> — chargeback and payment reversal detail</li>
              <li><Link href="https://bitcoinfoundation.org/news/blockchain-news/p2p-trading-safety-guide-2026-how-to-avoid-fraud-secure-transactions-and-trade-with-confidence/">Bitcoin Foundation — P2P Safety Guide 2026</Link> — fraud patterns in restricted markets</li>
            </ul>
          </Section>
        </div>
      </div>
    </Container>
  );
}

/* ── Reusable sub-components ── */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="pb-8 mb-8 border-b border-[#2b3139] last:border-b-0">
      <h2 className="text-lg font-bold text-[#eaecef] mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold text-[#eaecef] mt-5 mb-2">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#848e9c] leading-relaxed">{children}</p>;
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-1.5 pl-4">{children}</ul>;
}
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#FF6B00]/5 border-l-2 border-[#FF6B00] rounded-sm px-4 py-3 text-sm text-[#eaecef] leading-relaxed my-4">
      {children}
    </div>
  );
}
function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-xs">{children}</table>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-[10px] text-[#5e6673] uppercase font-bold tracking-wider pb-2 px-2 border-b border-[#2b3139]">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-2 px-2 text-[#848e9c] border-b border-white/[0.05]">{children}</td>;
}
function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="hover:bg-white/[0.02]">{children}</tr>;
}
function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li className="text-sm text-[#848e9c]">
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#FF6B00] hover:underline">{children}</a>
    </li>
  );
}
