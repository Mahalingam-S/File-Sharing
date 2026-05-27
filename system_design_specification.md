# Campus File-Sharing Platform: Comprehensive System Design Specification

This document outlines the detailed system design blueprint for the **Secure Campus File Sharing and Document Management System**. It covers the complete database architecture (ER Diagrams), multi-level Data Flow Diagrams (DFDs), User Interface wireframes, layout patterns, and high-fidelity design mockups.

---

## 1. Database Design (ER Diagram)

The database is modeled using **MongoDB** (a document-oriented NoSQL database) combined with **Mongoose ODM**. It relies on explicit reference bindings (`ObjectId`) and sparse, unique index configurations to guarantee speed and integrity.

### 1.1 Complete Entity-Relationship (ER) Diagram
The diagram below maps all collections, including properties, exact data types, constraints, and cardinalities.

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontFamily': 'system-ui, -apple-system, sans-serif',
    'fontSize': '16px',
    'textColor': '#1a202c',
    'typeColor': '#4a5568',
    'attributeBackgroundColor': '#f7fafc',
    'attributeTextColor': '#2d3748',
    'entityBackgroundColor': '#edf2f7',
    'entityBorderColor': '#2d3748',
    'lineColor': '#4a5568',
    'roleColor': '#2d3748'
  }
}}%%
erDiagram
    USER {
        ObjectId id PK
        string email UK
        string role
        string department
    }
    FILE {
        ObjectId id PK
        ObjectId folderId FK
        ObjectId ownerId FK
        string storageName UK
        string shareToken UK
    }
    FOLDER {
        ObjectId id PK
        ObjectId parentId FK
        ObjectId ownerId FK
        string shareToken UK
    }
    SHARED_LINK {
        ObjectId id PK
        ObjectId fileId FK
        string token UK
    }
    AUDIT_LOG {
        ObjectId id PK
        ObjectId userId FK
        ObjectId entityId FK
    }
    HELP_REQUEST {
        ObjectId id PK
        ObjectId userId FK
    }

    USER ||--o{ FILE : "uploads"
    USER ||--o{ FOLDER : "creates"
    USER ||--o{ AUDIT_LOG : "triggers"
    USER ||--o{ HELP_REQUEST : "submits"
    
    FOLDER ||--o{ FILE : "contains"
    FOLDER ||--o{ FOLDER : "nested"
    
    FILE ||--o{ SHARED_LINK : "shares"
```

### 1.2 Data Dictionary Summary
- **Collection `users`:** Manages identity, registration fields, and department scopes. Hashing is applied to credentials via Bcrypt pre-save triggers.
- **Collection `files`:** Records metadata, auto-classified lexical badges, and direct URL mapping parameters.
- **Collection `folders`:** Virtual folders enabling complex multi-level file cataloging, isolated Drop Folder logic, and deadlines.
- **Collection `sharedlinks`:** Handles sharing policies, credentials verification, and roles-based link access.
- **Collection `auditlogs`:** An immutable, queryable track for system audit logs. Uses polymorphic `entityId` for high adaptability.
- **Collection `helprequests`:** Multi-status ticketing pipeline mapping system errors or requests straight to platform administrators.

---

## 2. Data Flow Diagrams (DFD)

Data Flow Diagrams visually detail the pathways, boundary processes, storage hubs, and actors shaping the system.

### 2.1 Level 0 DFD (Context Diagram)
The Context Diagram defines the application's boundary interfaces, showing high-level information streams between external actors and the single centralized File-Sharing core.

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontFamily': 'system-ui, -apple-system, sans-serif',
    'fontSize': '18px',
    'lineColor': '#2d3748'
  }
}}%%
graph TD
    %% Nodes
    User["<b>Student / Faculty / Staff User</b>"]
    Admin["<b>System Administrator</b>"]
    Core["<b>[1.0] Campus File-Sharing Platform (Core System)</b>"]
    Google["<b>Google OAuth2 Provider</b>"]
    Smtp["<b>SMTP Email Notification Server</b>"]

    %% Data Streams
    User -->|<b>1. Credentials / Google Token</b>| Core
    User -->|<b>2. Upload streams / Folder actions</b>| Core
    Core -->|<b>3. Folder trees / Categorized files</b>| User
    Core -->|<b>4. Share tokens & Drop URLs</b>| User

    Admin -->|<b>5. Account approvals / Stat triggers</b>| Core
    Core -->|<b>6. Real-time Audit Logs & Support list</b>| Admin

    Core -->|<b>7. OAuth credential verification</b>| Google
    Google -->|<b>8. Verified identity profile</b>| Core

    Core -->|<b>9. Dispatch departmental notification emails</b>| Smtp

    %% Styling Classes for Premium High-Contrast Visibility
    classDef process fill:#E6FFFA,stroke:#319795,stroke-width:3px,font-size:18px,font-weight:bold,color:#1A202C;
    classDef entity fill:#FFF5F5,stroke:#E53E3E,stroke-width:3px,font-size:18px,font-weight:bold,color:#1A202C;
    classDef store fill:#EBF8FF,stroke:#3182CE,stroke-width:3px,font-size:18px,font-weight:bold,color:#1A202C;

    class Core process;
    class User,Admin,Google,Smtp entity;

    linkStyle default stroke:#2D3748,stroke-width:3px,font-size:15px,color:#1A202C,font-weight:bold;
```

---

### 2.2 Level 1 DFD (Functional Process Diagram)
The Level 1 DFD decomposes the system boundaries into five core process bubbles, charting how data traverses operational stages, registers in physical disks, and logs in collections.

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontFamily': 'system-ui, -apple-system, sans-serif',
    'fontSize': '18px',
    'lineColor': '#2d3748'
  }
}}%%
graph TB
    %% Entities
    Actor["<b>Student / Faculty / Staff</b>"]
    AdmActor["<b>System Administrator</b>"]

    %% Processes
    P1["<b>[1.0] Auth & Identity Verification</b>"]
    P2["<b>[2.0] Folder & File Management</b>"]
    P3["<b>[3.0] Anonymous Drop Box Manager</b>"]
    P4["<b>[4.0] NLP Document Classifier</b>"]
    P5["<b>[5.0] System Administration & Logging</b>"]

    %% Data Stores
    D1[("<b>(D1) User Profile Store</b>")]
    D2[("<b>(D2) File & Folder Store</b>")]
    D3[("<b>(D3) Obfuscated Disk Storage (storage/)</b>")]
    D4[("<b>(D4) Immutable Audit Log Store</b>")]

    %% P1 Flows
    Actor -->|<b>Credentials</b>| P1
    P1 -->|<b>Fetch record / validation</b>| D1
    D1 -->|<b>User Profile</b>| P1
    P1 -->|<b>Authorized JWT Session</b>| Actor

    %% P2 Flows
    Actor -->|<b>Upload File & Folder creation</b>| P2
    P2 -->|<b>Save file metadata</b>| D2
    P2 -->|<b>Write obfuscated file stream</b>| D3
    D2 -->|<b>Render Directory Tree</b>| P2
    P2 -->|<b>Show workspace folders/files</b>| Actor

    %% P3 Flows
    Actor -->|<b>Set Dropbox config & Deadline</b>| P3
    P3 -->|<b>Write Dropbox parameters</b>| D2
    Actor -->|<b>Guest: Drop coursework file</b>| P3
    P3 -->|<b>Obfuscate & store guest file</b>| D3
    P3 -->|<b>Save file metadata to target</b>| D2

    %% P4 Flows
    P2 -->|<b>Send originalName & mimeType</b>| P4
    P4 -->|<b>Return lexical classification badge</b>| P2

    %% P5 Flows
    P2 -.->|<b>Trigger event logs</b>| P5
    P3 -.->|<b>Trigger event logs</b>| P5
    P5 -->|<b>Write immutable audit record</b>| D4
    AdmActor -->|<b>Request system stats & logs</b>| P5
    D4 -->|<b>Audit records</b>| P5
    D1 -->|<b>Registration records</b>| P5
    P5 -->|<b>Display administration feeds</b>| AdmActor

    %% Styling Classes for Premium High-Contrast Visibility
    classDef process fill:#E6FFFA,stroke:#319795,stroke-width:3px,font-size:18px,font-weight:bold,color:#1A202C;
    classDef entity fill:#FFF5F5,stroke:#E53E3E,stroke-width:3px,font-size:18px,font-weight:bold,color:#1A202C;
    classDef store fill:#EBF8FF,stroke:#3182CE,stroke-width:3px,font-size:18px,font-weight:bold,color:#1A202C;

    class P1,P2,P3,P4,P5 process;
    class Actor,AdmActor entity;
    class D1,D2,D3,D4 store;

    linkStyle default stroke:#2D3748,stroke-width:3px,font-size:15px,color:#1A202C,font-weight:bold;
```

---

### 2.3 Level 2 DFD (Detailed File Upload & Verification Process)
Focuses specifically on the multi-tiered upload stream, tracing the progression of data from raw file buffers to classified database indexes and audit trails.

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontFamily': 'system-ui, -apple-system, sans-serif',
    'fontSize': '18px',
    'lineColor': '#2d3748'
  }
}}%%
graph TD
    %% Entity
    User["<b>Faculty / Student Owner</b>"]

    %% Processes
    P21["<b>[2.1] Size & Security Extension Filter</b>"]
    P22["<b>[2.2] Disk Writer & Obfuscation (UUID)</b>"]
    P23["<b>[2.3] Lexical Document Classifier</b>"]
    P24["<b>[2.4] MongoDB Metadata Broker</b>"]
    P25["<b>[2.5] Security Audit Logger</b>"]

    %% Data Stores
    Disk[("<b>(D3) Disk Storage</b>")]
    DB[("<b>(D2) Metadata database</b>")]
    Audit[("<b>(D4) Audit log database</b>")]

    %% Flows
    User -->|<b>Raw File Stream & folderId</b>| P21
    P21 -->|<b>Passes verification: size < 50MB, no execs</b>| P22
    P21 -->|<b>Fail size/ext check</b>| User

    P22 -->|<b>Write obfuscated binary stream</b>| Disk
    P22 -->|<b>Emit unique storageName & ownerId</b>| P23
    
    P23 -->|<b>Analyze name patterns & MIME</b>| P24
    P24 -->|<b>Insert complete Mongoose File Document</b>| DB
    
    P24 -->|<b>Trigger security event details</b>| P25
    P25 -->|<b>Write audit record</b>| Audit
    P24 -->|<b>HTTP 201: Upload & Classification Confirmed</b>| User

    %% Styling Classes for Premium High-Contrast Visibility
    classDef process fill:#E6FFFA,stroke:#319795,stroke-width:3px,font-size:18px,font-weight:bold,color:#1A202C;
    classDef entity fill:#FFF5F5,stroke:#E53E3E,stroke-width:3px,font-size:18px,font-weight:bold,color:#1A202C;
    classDef store fill:#EBF8FF,stroke:#3182CE,stroke-width:3px,font-size:18px,font-weight:bold,color:#1A202C;

    class P21,P22,P23,P24,P25 process;
    class User entity;
    class Disk,DB,Audit store;

    linkStyle default stroke:#2D3748,stroke-width:3px,font-size:15px,color:#1A202C,font-weight:bold;
```

---

## 3. User Interface (UI) Design

The user interface utilizes a custom **Glassmorphism Design System** designed with clean HSL colors and native dark-themed backdrops. This section details the visual layout structural blueprints.

### 3.1 Workspace Dashboard Layout (Wireframe Mapping)
```
+----------------------------------------------------------------------------------------------------+
|  [Logo] Campus File Sharing                [User: Prof. Sharma (Faculty) - CSE Department]         |
+----------------------------------------------------------------------------------------------------+
|  ( ) Sidebar Menu      |  Path: Root / CSE_Resources / Labs /                                      |
|                        |  [+ New Folder]  [^^ Upload File]  [+] Enable Drop Folder                 |
|  [*] My Workspace      +---------------------------------------------------------------------------+
|  [D] Department Drive  |                                                                           |
|  [R] Recent Uploads    |  +---------------------------------------------------------------------+  |
|  [S] Shared Links      |  | [Folder Icon] CSE_Assignments2026   [Drop Box: Active (Expires 8h)]   |  |
|  [H] Help / Support    |  +---------------------------------------------------------------------+  |
|                        |  | [Folder Icon] Lecture_Slides_Notes  [Public: Department Drive]        |  |
|  --------------------  |  +---------------------------------------------------------------------+  |
|  [Storage Usage]       |                                                                           |
|  [=== 42% of 5GB ===]  |  Files:                                                                   |
|                        |  +---------------------------------------------------------------------+  |
|  [Logout Button]       |  | [PDF] Lab1_Instructions.pdf   [3.2 MB]  [Category: Assignments]  [V] |  |
|                        |  +---------------------------------------------------------------------+  |
|                        |  | [DOC] Syllabus_MCA_2026.docx  [1.4 MB]  [Category: Syllabus]     [ ] |  |
|                        |  +---------------------------------------------------------------------+  |
|                        |  | [ZIP] Source_Code_Lab2.zip    [12.8 MB] [Category: Lab Records]  [ ] |  |
|                        |  +---------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------------------------+
```

### 3.2 High-Fidelity UI Mockup
The mockup image below represents the finished product interface. It is configured with animated CSS mesh gradients, glowing frosted cards, backdrop blurs, and distinct colorful category tags representing the automated NLP classification:

*(High-Fidelity Dashboard Mockup displayed below in conversation)*

### 3.3 Core UI Design System Rules
- **Color Architecture:** High-contrast dark backgrounds using curated deep slate HSL scales (`hsl(220, 20%, 8%)`), accented with soft neon purples and blues for interactive components.
- **Glassmorphism Panels:** Frosted cards are styled with `backdrop-filter: blur(16px); background: rgba(255, 255, 255, 0.03)` with a precise `border: 1px solid rgba(255, 255, 255, 0.08)`.
- **Classification Badges:** Color-coded based on category data returned from the classifier:
  - *Assignments:* Emerald Green
  - *Circulars / Circulars:* Amber Yellow
  - *Lab Records:* Intense Cyan
  - *Syllabus:* Royal Purple
  - *Lecture Notes:* Soft Sapphire Blue
  - *Uncategorized:* Slate Grey
