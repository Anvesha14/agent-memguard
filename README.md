# 🛡️ MemGuard

### Trust-Aware, Tamper-Evident Memory & Zero-Trust Execution Layer for Autonomous AI Agents

> **Trust what your AI remembers. Verify where it came from. Control what it is allowed to do.**

<p align="center">

<a href="https://agent-memguard.vercel.app">
<img src="https://img.shields.io/badge/🚀%20Live%20Demo-00C853?style=for-the-badge" alt="Live Demo"/>
</a>

<a href="https://github.com/Anvesha14/agent-memguard">
<img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" alt="GitHub"/>
</a>

<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>

<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>

<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>

</p>

---

> **DecentraHack 2.0 — PS 2: AI Agent Memory Poisoning & Trust Management**

# 🚨 The Problem

Autonomous AI agents are becoming increasingly capable of remembering information, reasoning across multiple steps, using external tools, and taking actions on behalf of users.

But this autonomy introduces a critical security problem:

> **What happens when an AI agent's memory gets poisoned?**

A single malicious entry — such as a phishing email, manipulated document, scraped webpage, or compromised tool output — can enter an agent's memory and later be retrieved as trusted information.

That poisoned memory can influence:

```text
Memory
   ↓
Reasoning
   ↓
Derived Facts
   ↓
Plans
   ↓
Tool Calls
   ↓
Real-World Actions
Why Existing Approaches Are Not Enough
Traditional AI security often focuses on securing the input, detecting prompt injection, or validating the final output.
But autonomous agents introduce another critical security boundary:
What the agent remembers and trusts between input and action.

MemGuard addresses this gap by making memory trust-aware, traceable, tamper-evident, and action-controlled.
💡 Our Solution
MemGuard is a security middleware layer for autonomous AI agents that treats memory as a security boundary rather than passive storage.
For every important memory, MemGuard tracks:
- Source — Where did the information come from?
- Reliability — How trustworthy is the source?
- Corroboration — Is the information supported by other evidence?
- Consistency — Does it conflict with existing knowledge?
- Time — Has the information become stale?
- Lineage — What memories or sources produced it?
- Impact — What actions could this memory influence?
Instead of allowing an agent to blindly trust its memory, MemGuard creates a continuous security pipeline:
External Information
        ↓
Memory Ingestion
        ↓
Poison / Conflict Detection
        ↓
Dynamic Trust Evaluation
        ↓
Provenance & Lineage Tracking
        ↓
Tamper-Evident Ledger
        ↓
Zero-Trust Action Gate
        ↓
   ┌────┴────┐
   ↓         ↓
 ALLOW      BLOCK
              ↓
       Human Approval /
       Blast-Radius Purge

Core Principle
An AI agent should not only know what it remembers — it should know how much it should trust that memory before allowing it to influence an action.

🛡️ Core Security Architecture
MemGuard is built around four interconnected security layers that work together to protect an autonomous agent from memory poisoning and unsafe downstream actions.
Security Layer	Purpose
🧠 Dynamic Trust Engine	Evaluates how trustworthy each memory is using source reliability, corroboration, time decay, and consistency
🌳 Provenance DAG	Tracks the origin, dependencies, and lineage of memories and derived information
🔐 Cryptographic Ledger	Maintains a tamper-evident, SHA-256 hash-chained history of memory events
🛑 Zero-Trust Action Gate	Evaluates whether a memory is trustworthy enough to influence a potentially risky tool call


Together, these layers create a continuous security boundary between what an agent remembers and what an agent is allowed to do.
        MEMORY INGESTION
               │
               ▼
      ┌─────────────────┐
      │ Poison Detection│
      └────────┬────────┘
               ▼
      ┌─────────────────┐
      │  Trust Engine   │
      └────────┬────────┘
               ▼
      ┌─────────────────┐
      │ Provenance DAG  │
      └────────┬────────┘
               ▼
      ┌─────────────────┐
      │ SHA-256 Ledger  │
      └────────┬────────┘
               ▼
      ┌─────────────────┐
      │ Action Risk Gate│
      └────────┬────────┘
               ▼
          ┌────┴────┐
          │         │
        ALLOW      BLOCK
                    │
             ┌──────┴──────┐
             ▼             ▼
       Human Approval   Blast-Radius
                         Purge

🧮 Dynamic Trust Model
MemGuard computes an effective trust score using:
Effective Trust
=
Source Reliability
× Corroboration
× Time Decay
× Consistency

Trust is not static.
As information becomes stale, conflicts with other evidence, or originates from unreliable sources, its ability to influence downstream decisions decreases.
Anti-Laundering Trust Inheritance
Derived memories cannot become more trustworthy than the information they were derived from.
Derived Memory Trust
=
MIN(Parent Memory Trust Scores)\
This prevents poisoned information from being "laundered" through summarization, reasoning, or repeated derivation.
🔒 Security Boundary
The key design principle is:
Memory trust must be evaluated before memory is allowed to influence a sensitive action.

This transforms agent memory from passive storage into an actively monitored security layer.

# 🔐 Key Security Features

MemGuard combines multiple security mechanisms to prevent a poisoned memory from silently influencing an autonomous agent.

## 1. 🧠 Multi-Tier Poison & Contradiction Detection

MemGuard analyzes incoming memories at multiple levels:

- **Tier 1 — Direct Pattern Detection**
  - Detects suspicious instructions, credential manipulation, payment changes, and other known attack patterns.

- **Tier 2 — AI-Based Classification**
  - Uses Gemini to identify covert or indirect malicious instructions that may not match simple patterns.

- **Tier 3 — Semantic Contradiction Analysis**
  - Detects conflicts between newly ingested information and trusted existing memories.

This layered approach helps reduce dependence on a single detection technique.

---

## 2. 📊 Dynamic Trust Scoring

Every memory receives a continuously evaluated trust score based on:

```text
Source Reliability
        ×
Corroboration
        ×
Time Decay
        ×
Consistency
Trust can decrease when information becomes stale, contradictory, unreliable, or insufficiently supported.
3. 🚫 Anti-Laundering Trust Inheritance
A poisoned memory must not become trustworthy simply because an agent summarizes, derives, or reasons over it.
MemGuard therefore propagates the weakest trust value through derived memory:

Parent A ──┐
           ├──► Derived Memory
Parent B ──┘

Derived Trust
      =
MIN(Parent Trust Scores)
This prevents trust laundering through derived knowledge.
4. 🌳 Provenance DAG
MemGuard maintains a directed provenance graph showing how information flows through the agent's memory.
Source
  ↓
Memory
  ↓
Derived Fact
  ↓
Plan
  ↓
Action
When a memory is identified as poisoned, its downstream dependencies can be traced to determine the potential blast radius of the attack.
5. 🔐 Tamper-Evident SHA-256 Ledger
Memory events are recorded in an append-only cryptographic ledger.
Each block references the previous block's hash:
Block N-1 Hash
      ↓
Block N
      ↓
Block N+1
A modification to an earlier block changes its hash and breaks the chain.
This enables MemGuard to verify whether the recorded memory history has been tampered with.
6. 🛑 Zero-Trust Action Gate
MemGuard does not allow a memory to directly trigger a sensitive action simply because it exists in the agent's memory.
Every tool call is evaluated according to:
- Memory trust
- Provenance and lineage
- Action risk
- Required trust threshold
High-risk actions require stronger trust or human approval.
Memory Trust
     +
Provenance
     +
Action Risk
     ↓
ZERO-TRUST DECISION
     ↓
 ┌───┴────┐
 ▼        ▼
ALLOW    BLOCK

7. 💥 Blast-Radius Purge & Rollback
When poisoned memory is detected, MemGuard can trace affected descendants and isolate contaminated nodes.
The system then:
1. Identifies the poisoned root.
2. Traverses dependent memories and actions.
3. Determines the affected blast radius.
4. Purges contaminated descendants.
5. Appends a cryptographic tombstone to the ledger.
6. Verifies the integrity of the remaining memory chain.
POISONED ROOT
      ↓
DEPENDENT MEMORIES
      ↓
AFFECTED PLANS
      ↓
RISKY ACTIONS
      ↓
BLAST-RADIUS ISOLATION
      ↓
PURGE + ROLLBACK
8. 🔎 Google Search Grounding for Threat Intelligence
MemGuard can use Google Search Grounding to corroborate external information and provide additional threat intelligence.
The system can:
- Search for supporting evidence.
- Verify factual entities.
- Corroborate suspicious information.
- Surface clickable source references.
This adds an external evidence layer before information is trusted.

9. 🎙️ Voice Security Officer
MemGuard includes a voice-based security interface powered by the Gemini Live API.
The Voice Security Officer can provide spoken interaction with the security dashboard, including queries such as:
"What is the current threat status?"

"Why was invoice EML-102 quarantined?"

"How does the SHA-256 ledger work?"
The interface includes live audio feedback, transcript logging, and a text fallback.
10. 📋 Compliance Audit Export
MemGuard provides a one-click audit package containing security evidence such as:
- Ledger snapshot
- Block-by-block cryptographic hashes
- Provenance information
- Zero-trust action decisions
- Verification status
- Cryptographic integrity evidence
This creates a structured record that can support AI governance and compliance-oriented review workflows.

# 💥 Attack Scenario — From Poisoned Memory to Blocked Action

MemGuard demonstrates how a seemingly harmless piece of information can become a security threat when it enters an autonomous agent's memory.

## 🎯 The Attack

A vendor invoice contains a hidden instruction attempting to modify the vendor's bank account details.

The malicious information is ingested into the agent's memory.

```text
Malicious Invoice
      ↓
Memory Ingestion
      ↓
Poison Detected
      ↓
Trust Score Drops
      ↓
Provenance Links Created
      ↓
Agent Attempts High-Risk Action
      ↓
ZERO-TRUST GATE
      ↓
🚫 ACTION BLOCKED
Step 1 — Poisoned Memory Enters the System
The attacker introduces a manipulated vendor invoice containing a malicious bank-account change.
MemGuard does not immediately treat the information as trusted simply because it came from an apparently valid document.
Step 2 — Poisoning Is Detected
The memory passes through MemGuard's detection layers.
Suspicious instructions and inconsistencies are identified, causing the affected memory's trust level to decrease.
The poisoned memory is also connected to its source and downstream dependencies through the provenance graph.
Step 3 — The Agent Attempts a High-Risk Action
The poisoned information attempts to influence a financial tool call:
send_payment(
    $250,000,
    "KY..."
)
Because this is a high-risk action, the Zero-Trust Action Gate requires sufficiently trusted supporting memory.
Lineage Trust: 15%
Required Trust: 85%

Result: 🚫 BLOCKED

The action never reaches execution.
Step 4 — Blast-Radius Analysis
MemGuard traces the poisoned memory through the provenance graph to identify everything that depends on it.
Example attack lineage:
EML-102
   ↓
FACT-044
   ↓
PLAN-012
   ↓
ACT-001
   ↓
ACT-PAYOUT

This allows the system to determine the potential blast radius instead of treating the poisoned memory as an isolated event.
Step 5 — Blast-Radius Purge
The contaminated descendants are isolated and purged.
MemGuard then appends a cryptographic tombstone to the ledger and verifies that the remaining memory chain is intact.
Poisoned Memory
      ↓
Affected Descendants
      ↓
Isolation
      ↓
Purge
      ↓
Cryptographic Tombstone
      ↓
Integrity Verification

🛡️ Final Security Outcome
The complete attack lifecycle is therefore:
INGEST
  ↓
DETECT
  ↓
SCORE
  ↓
TRACE
  ↓
BLOCK
  ↓
PURGE
  ↓
VERIFY

MemGuard does not merely detect poisoned memory — it prevents that memory from becoming an unsafe real-world action.

STEP 6 — Live Demo & Screenshots
Ab README mein visuals add karte hain, because tumhare project ka UI actually strong hai. Isse judge ko sirf description nahi, actual working product dikhega.
Previous section ke neeche ye paste karo:# 🖥️ Live Demo & Security Dashboard

MemGuard includes an interactive security command center designed to make the agent's memory state, trust decisions, provenance, and security events visible in real time.

### 🚀 Live Application

👉 **[Launch MemGuard Live Demo](https://agent-memguard.vercel.app)**

### 🔍 Dashboard

The main dashboard provides an overview of:

- Active memories
- Memory trust levels
- Ledger integrity
- Zero-trust interceptions
- Average effective trust
- Current threat status

### 💥 Attack Simulator

The interactive Attack Simulator demonstrates a complete memory-poisoning attack:

**Poisoned Memory → Detection → High-Risk Action → Interception → Blast-Radius Purge**

### 🌳 Provenance DAG

The Provenance view visualizes how information flows from its original source into derived facts, plans, and actions.

This allows investigators to trace the origin and impact of suspicious memories.

### 🔐 Cryptographic Ledger

The Ledger Audit view exposes the tamper-evident SHA-256 chain and allows the integrity of the memory history to be verified.

### 🎙️ Voice Security Officer

The Voice Co-Pilot provides a conversational interface for querying the security state of the agent and investigating security events.

### 🔎 Search Intelligence

The Search Intel feature uses Google Search Grounding to corroborate external information and provide source references for investigation.

---

## 📸 Security Walkthrough

### 1. Security Dashboard & Attack Simulator

The dashboard provides a real-time overview of memory trust, threat status, ledger integrity, and security controls.

![MemGuard Security Dashboard](screenshots/dashboard.png)

### 2. Attack Intercepted

A poisoned vendor invoice attempts to influence a high-risk financial action. The Zero-Trust Action Gate blocks the action because the supporting memory lineage does not meet the required trust threshold.

![Attack Intercepted](screenshots/attack-intercepted.png)

### 3. Blast-Radius Purge

MemGuard traces contaminated descendants, isolates the affected nodes, and performs a verified blast-radius purge.

![Blast-Radius Purge](screenshots/blast-radius-purge.png)

### 4. Provenance DAG

The provenance graph shows the relationships between trusted, quarantined, and poisoned memories.

![Provenance DAG](screenshots/provenance-dag.png)

### 5. Cryptographic Ledger Audit

The ledger view provides cryptographic verification of the append-only memory history.

![Cryptographic Ledger](screenshots/ledger-audit.png)
# 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TypeScript, Vite |
| **Styling** | Tailwind CSS |
| **Backend** | Node.js, Express |
| **Real-Time Communication** | WebSocket |
| **AI Intelligence** | Google Gemini |
| **Threat Intelligence** | Google Search Grounding |
| **Cryptography** | SHA-256 Hash Chaining |
| **Deployment** | Vercel |
| **Version Control** | Git & GitHub |

---

# 📁 Project Structure

```text
agent-memguard/
│
├── src/
│   ├── components/
│   │   └── Dashboard UI Components
│   │
│   ├── lib/
│   │   ├── trustEngine
│   │   ├── poisonDetector
│   │   ├── actionGuard
│   │   ├── ledgerGraph
│   │   ├── crypto
│   │   └── demoScenarios
│   │
│   └── ...
│
├── api/
│   └── Serverless API Endpoints
│
├── server.ts
│   └── Express + WebSocket Backend
│
├── python/
│   └── Python Reference Implementation
│
├── public/
│   └── Static Assets
│
├── package.json
├── vite.config.*
└── README.md

⚙️ How It Works
MemGuard follows a security-first processing pipeline:
External Data
     ↓
┌──────────────────────┐
│ Memory Ingestion     │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Poison Detection     │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Dynamic Trust Engine │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Provenance Tracking  │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ SHA-256 Ledger       │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Zero-Trust Gate      │
└──────────┬───────────┘
           ↓
      ┌────┴────┐
      ↓         ↓
    ALLOW      BLOCK
                ↓
       ┌────────┴────────┐
       ↓                 ↓
Human Approval     Blast-Radius
                     Purge
The architecture ensures that memory trust is evaluated before memory can influence a sensitive action.
# 🚀 Getting Started

Follow these steps to run MemGuard locally.

## Prerequisites

Make sure you have installed:

- Node.js
- npm
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/Anvesha14/agent-memguard.git
cd agent-memguard2. Install Dependencies
npm install3. Configure Environment Variables
Create a .env.local file in the project root:
GEMINI_API_KEY=your_gemini_api_key

Keep your API key private. Never commit .env.local or expose your API key publicly.

4. Start the Development Server
npm run dev

The application will be available at the local URL shown in your terminal.
5. Production Build
To create a production build:
npm run build

To preview the production build locally:
npm run preview

🌐 Live Deployment
MemGuard is deployed on Vercel.
👉 Open the Live Demo
The production deployment can be connected directly to the GitHub repository for continuous deployment.

# 🧩 Security Design Decisions

MemGuard is designed around a simple principle:

> **Trust should be earned, traceable, and continuously evaluated — never assumed.**

### Why Trust Scores?

A binary trusted/untrusted model is often insufficient for autonomous agents.

MemGuard uses a dynamic trust score so that information can gradually lose or gain influence based on:

- Source reliability
- Corroborating evidence
- Time
- Consistency with existing information
- Provenance

### Why Provenance?

Detecting a poisoned memory is only the first step.

The system must also answer:

> **What else could this memory have influenced?**

The Provenance DAG allows MemGuard to trace dependencies and identify the potential blast radius of contaminated information.

### Why a Cryptographic Ledger?

A security system should not rely solely on the database that it is responsible for protecting.

The SHA-256 hash chain provides a tamper-evident history of memory events and makes unauthorized modification detectable.

### Why Zero-Trust Actions?

Even if a memory exists inside the agent's knowledge base, it should not automatically be trusted enough to trigger a sensitive action.

MemGuard therefore evaluates the trust and lineage of supporting memories against the risk of the requested action.

### Why Human-in-the-Loop?

Some actions are too consequential to execute solely from uncertain or potentially contaminated memory.

When trust is insufficient for a high-risk operation, MemGuard can stop execution and require human approval rather than allowing the agent to proceed blindly.

---

# 🎯 Design Goal

MemGuard is not designed to make an autonomous agent **trust everything less**.

It is designed to make the agent **trust the right information more — and the uncertain information less.**

```text
TRUST NOTHING BLINDLY
        ↓
VERIFY
        ↓
TRACE
        ↓
ASSESS RISK
        ↓
ACT SAFELY

# 🎮 Demo Controls

MemGuard includes interactive controls to demonstrate how the security system responds to different memory-security scenarios.

| Control | Purpose |
|---|---|
| **Attack Simulator** | Simulates a memory-poisoning attack and shows how the action is intercepted |
| **Provenance DAG** | Explores memory lineage and downstream dependencies |
| **Ledger Audit** | Verifies the SHA-256 hash chain and ledger integrity |
| **Simulate DB Tampering** | Demonstrates detection of an altered memory history |
| **Restore Clean Chain** | Restores the verified ledger state after a simulated tampering event |
| **Ingestion Sandbox** | Allows testing of memory ingestion and security evaluation |
| **Search Intel** | Uses external search grounding to corroborate information |
| **Voice Co-Pilot** | Provides voice-based interaction with the security dashboard |
| **Export Audit** | Generates a structured compliance-oriented audit package |
| **Day / Night Mode** | Switches the dashboard between light and dark visual modes |

---

# 🏆 What MemGuard Demonstrates

MemGuard demonstrates that autonomous AI agents can be given a stronger security boundary around their persistent memory.

The system connects:

```text
Memory Security
      +
Trust Management
      +
Provenance
      +
Cryptographic Integrity
      +
Action Governance
      +
Recovery
      =
Zero-Trust Agent Memory

Instead of asking only:
"Is this memory useful?"

MemGuard asks:
"Where did this memory come from, how trustworthy is it, what depends on it, and what is the agent allowed to do because of it?"

# 👥 Team

Built with passion for secure and responsible AI systems.

| Team Member | Role |
|---|---|
| **Anvesha Gupta** | Team member |
| **Barbie Rajput** | Team leader |

---

# 🔗 Project Links

- 🚀 **Live Demo:** https://agent-memguard.vercel.app
- 💻 **GitHub Repository:** https://github.com/Anvesha14/agent-memguard

---

# 📄 License

This project is developed for **DecentraHack 2.0** and educational/hackathon purposes.

---

<p align="center">

### 🛡️ MemGuard

**Trust the memory. Verify the lineage. Control the action.**

</p>
