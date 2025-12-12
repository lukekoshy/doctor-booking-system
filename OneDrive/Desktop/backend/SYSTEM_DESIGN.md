# Doctor Booking System - Technical Architecture & Scalability Design

## Executive Summary

This document outlines the architecture, design decisions, and scalability strategy for a production-grade Doctor Appointment Booking System. The system handles high-concurrency scenarios, prevents overbooking through atomic transactions, and is designed to support millions of concurrent users.

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Frontend)                       │
│  React + TypeScript | Context API | React Router | Responsive UI    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CDN / REVERSE PROXY                            │
│              (Cloudflare / Nginx / AWS CloudFront)                  │
│  - SSL/TLS Termination                                              │
│  - Compression                                                       │
│  - Rate Limiting                                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                                │
│           (Kong / AWS API Gateway / Nginx)                          │
│  - Request validation                                               │
│  - Rate limiting (100 req/sec per user)                            │
│  - Request routing                                                  │
│  - Monitoring & metrics                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    ┌──────────┐        ┌──────────┐      ┌──────────┐
    │ Server 1 │        │ Server 2 │      │ Server N │
    │ Node.js  │        │ Node.js  │      │ Node.js  │
    │(Port 4k) │        │(Port 4k) │      │(Port 4k) │
    └────┬─────┘        └────┬─────┘      └────┬─────┘
         │                   │                  │
         └───────────────────┼──────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │    CONNECTION POOL (PgBouncer)     │
        │    Max 100 conns, Pool size: 20    │
        └────────────────────┬───────────────┘
                             │
             ┌───────────────┼───────────────┐
             │               │               │
             ▼               ▼               ▼
        ┌─────────┐  ┌─────────────┐  ┌─────────┐
        │ Primary │  │  Replica 1  │  │ Replica │
        │  DB     │  │   (Read)    │  │  2 (RO) │
        │(Write)  │  │             │  │         │
        └─────────┘  └─────────────┘  └─────────┘
             │
             ▼
    ┌─────────────────┐
    │ Replication     │
    │ (Streaming)     │
    └─────────────────┘

        ┌──────────────────────┐
        │  Cache Layer         │
        │ (Redis Cluster)      │
        │ - Slot details       │
        │ - Doctor info        │
        │ - Booking counts     │
        └──────────────────────┘

        ┌──────────────────────┐
        │  Message Queue       │
        │ (RabbitMQ/Kafka)     │
        │ - Booking events     │
        │ - Notifications      │
        │ - Audit logs         │
        └──────────────────────┘
```

## 2. Key Components

### 2.1 API Gateway
**Purpose:** Single entry point for all client requests
- Request validation and schema enforcement
- Rate limiting (per-user, per-IP)
- Authentication token validation
- Request logging and metrics

**Implementation:**
```
Max concurrent requests: 10,000
Rate limit: 100 requests/sec per user
Timeout: 30 seconds
```

### 2.2 Application Servers (Node.js + Express)
**Purpose:** Core business logic and API endpoints
- Stateless design (horizontally scalable)
- Connection pooling to database
- Request validation
- Error handling and logging

**Scaling Strategy:**
- Horizontal scaling: Add more Node.js instances behind load balancer
- Load balancer: Round-robin distribution
- Target: 100-500 concurrent users per instance
- Deployment: Docker containers with Kubernetes orchestration

### 2.3 Database Layer (PostgreSQL)

#### Primary-Replica Architecture
```
PRIMARY (Write Operations):
├── Booking inserts/updates
├── Slot modifications
├── Doctor management

REPLICAS (Read Operations):
├── List slots
├── List doctors
├── Report generation
```

#### Connection Pooling (PgBouncer)
```
Pool mode: Transaction
Max connections: 100
Min connections: 10
Idle timeout: 300 seconds
```

---

## 3. Database Design & Scaling Strategy

### 3.1 Current Schema (Single Database)

```sql
-- Doctors table
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slots table
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_time CHECK (start_time < end_time)
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  patient_contact VARCHAR(20) NOT NULL,
  status booking_status DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_bookings_slot_status ON bookings(slot_id, status);
CREATE INDEX idx_slots_doctor ON slots(doctor_id);
CREATE INDEX idx_bookings_created ON bookings(created_at);
```

### 3.2 Scaling Strategy

#### Phase 1: Single Database Optimization (0-100K users)
- Add read replicas for SELECT queries
- Implement Redis caching for frequently accessed data
- Optimize indexes
- Archive old bookings (>6 months) to separate table

#### Phase 2: Database Sharding (100K-1M users)

**Sharding Strategy: Hash-based on Doctor ID**

```
Shard 0: Doctor IDs hash % 4 = 0
Shard 1: Doctor IDs hash % 4 = 1
Shard 2: Doctor IDs hash % 4 = 2
Shard 3: Doctor IDs hash % 4 = 3

Algorithm:
shard_id = hash(doctor_id) % num_shards
```

**Shard Distribution:**
```
├── Shard DB-1: Doctors 0-24k, ~250GB
├── Shard DB-2: Doctors 25k-50k, ~250GB
├── Shard DB-3: Doctors 50k-75k, ~250GB
└── Shard DB-4: Doctors 75k-100k, ~250GB
```

**Cross-shard Queries:**
- Global booking list → Query all shards (scatter-gather pattern)
- Doctor-specific data → Route to single shard

#### Phase 3: Time-Series Data Partitioning

```
PARTITION bookings BY RANGE (created_at)
├── bookings_2025_q1 (Jan-Mar)
├── bookings_2025_q2 (Apr-Jun)
├── bookings_2025_q3 (Jul-Sep)
└── bookings_2025_q4 (Oct-Dec)
```

Benefits:
- Faster queries on recent data
- Easier archival of old data
- Improved index performance

### 3.3 Replication Strategy

**Streaming Replication:**
```
Primary → Replica-1 (Sync): 0ms lag
Primary → Replica-2 (Async): 1-5s lag

Read Distribution:
- Critical reads: Primary
- Consistent reads: Replica-1
- Analytics reads: Replica-2
```

**Failover:**
- Automated failover using Patroni
- Primary failure → Replica-1 promoted
- RTO (Recovery Time): < 30 seconds
- RPO (Recovery Point): < 1 second

---

## 4. Concurrency Control Mechanisms

### 4.1 Row-Level Locking (Current Implementation)

```javascript
// Atomic booking with row-level lock
BEGIN TRANSACTION;
  SELECT * FROM slots WHERE id = ? FOR UPDATE;  // Locks this row
  
  // Count current bookings
  SELECT COUNT(*) FROM bookings 
  WHERE slot_id = ? AND status IN ('PENDING', 'CONFIRMED');
  
  // Check capacity
  IF count < capacity:
    INSERT INTO bookings (...);
    COMMIT;
  ELSE:
    ROLLBACK;
    RETURN 409 Conflict;
```

**Advantages:**
- Simple, built-in mechanism
- No deadlock (sequential locking)
- ACID guarantees
- Sub-millisecond latency

**Limitations:**
- Single database bottleneck
- Max throughput: ~1000-2000 bookings/sec
- Doesn't scale across shards

### 4.2 Pessimistic Locking (Explicit Locks Table)

For distributed scenarios:

```sql
CREATE TABLE slot_locks (
  slot_id UUID PRIMARY KEY,
  locked_at TIMESTAMP,
  locked_by VARCHAR(50)
);

-- Acquire lock
INSERT INTO slot_locks (slot_id, locked_at, locked_by)
VALUES (?, NOW(), ?)
ON CONFLICT DO NOTHING;

-- If insert succeeded, we have the lock
-- Check if we won or lost
SELECT * FROM slot_locks WHERE slot_id = ? AND locked_by = ?;
```

**TTL:** 5 seconds (auto-release if process crashes)

### 4.3 Optimistic Locking (Version-based)

For eventual consistency scenarios:

```sql
ALTER TABLE slots ADD COLUMN version INT DEFAULT 1;

-- Update with version check
UPDATE slots 
SET available_count = available_count - 1, version = version + 1
WHERE id = ? AND version = ?
RETURNING *;

-- If no rows returned, version mismatch occurred
-- Retry with current version
```

### 4.4 Event Sourcing (Advanced)

```sql
CREATE TABLE booking_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50), -- 'booking_requested', 'booking_confirmed'
  slot_id UUID,
  patient_id UUID,
  timestamp TIMESTAMP,
  data JSONB
);

-- Immutable append-only log
INSERT INTO booking_events (...) VALUES (...);

-- Rebuild current state from events
SELECT COUNT(*) FROM booking_events 
WHERE slot_id = ? AND event_type = 'booking_confirmed';
```

---

## 5. Caching Strategy

### 5.1 Cache Architecture (Redis)

```
┌─────────────────┐
│  Application    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Redis   │ (Max 10GB memory)
    │ Cluster  │
    └────┬─────┘
         │
    ┌────▼────────┐
    │ PostgreSQL  │
    │ Database    │
    └─────────────┘
```

### 5.2 Cache Keys & TTL

```javascript
// Doctors list
Key: "doctors:all"
TTL: 3600 (1 hour)
Size: ~5KB

// Slot details
Key: "slot:{id}"
TTL: 300 (5 minutes)
Size: ~500B per slot

// Booking count
Key: "slot:{id}:bookings:count"
TTL: 60 (1 minute)
Size: ~50B

// Doctor's slots
Key: "doctor:{id}:slots"
TTL: 1800 (30 minutes)
Size: ~10KB

// Session cache
Key: "session:{token}"
TTL: 86400 (24 hours)
Size: ~1KB
```

### 5.3 Cache Invalidation Strategy

```javascript
// Write-Through Cache
1. Check Redis
2. If miss, query DB
3. Store in Redis
4. Return result

// On Update:
// Slot created
DELETE "doctors:{doctor_id}:slots"
DELETE "doctor:{doctor_id}" (refresh count)

// Booking created
DELETE "slot:{slot_id}:bookings:count"
DECREMENT "slot:{slot_id}:available"

// Booking confirmed
DELETE "slot:{slot_id}:bookings:count"
```

### 5.4 Cache Warming

```javascript
// On startup
Redis.warmCache({
  doctors: db.getAllDoctors(),
  activeSlots: db.getSlotsForNext30Days(),
  stats: db.getAggregateStats()
});

// Periodic refresh
setInterval(() => {
  Redis.refresh("doctors:all");
  Redis.refresh("active_slots");
}, 3600000);
```

---

## 6. Message Queue Architecture

### 6.1 Booking Events Pipeline

```
┌──────────────────┐
│ User books slot  │
└────────┬─────────┘
         │
         ▼
  ┌─────────────────────────────────┐
  │ Publish "booking.created" event │
  │ to RabbitMQ/Kafka               │
  └─────────┬───────────────────────┘
            │
    ┌───────┴───────┬──────────────┬──────────────┐
    │               │              │              │
    ▼               ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐
│ Payment │  │ Email    │  │ SMS        │  │ Analytics│
│ Service │  │ Service  │  │ Notifier   │  │ Logger   │
└─────────┘  └──────────┘  └────────────┘  └──────────┘

Dead Letter Queue (DLQ):
└─► Failed events → Retry with exponential backoff
```

### 6.2 Event Types

```json
{
  "booking.created": {
    "booking_id": "uuid",
    "slot_id": "uuid",
    "patient_name": "string",
    "created_at": "timestamp"
  },
  "booking.confirmed": {
    "booking_id": "uuid",
    "confirmed_at": "timestamp"
  },
  "booking.failed": {
    "booking_id": "uuid",
    "reason": "TIMEOUT | NO_SEAT | SYSTEM_ERROR",
    "failed_at": "timestamp"
  }
}
```

### 6.3 Queue Configuration

```
Queue: "bookings"
├── TTL: 7 days
├── Max retries: 3
├── Batch size: 100
├── Consumer threads: 5
└── Prefetch count: 10

Dead Letter Queue (DLQ): "bookings.dlq"
├── TTL: 30 days
├── Manual review required
└── Alert threshold: >10 items/min
```

---

## 7. Monitoring & Observability

### 7.1 Key Metrics

```
Application Metrics:
├── Requests/sec
├── Avg response time (p50, p95, p99)
├── Error rate (4xx, 5xx)
├── Booking success rate
└── Concurrent connections

Database Metrics:
├── Query latency (p50, p95, p99)
├── Connection pool utilization
├── Slow query log (>500ms)
├── Replication lag
└── Lock wait time

Infrastructure:
├── CPU utilization
├── Memory usage
├── Disk I/O
├── Network throughput
└── Container/Pod status
```

### 7.2 Logging Strategy

```
Log Levels:
DEBUG: Development only, verbose operations
INFO: Key business events (booking created, slot added)
WARN: Recoverable errors (retry attempts, stale cache)
ERROR: Non-recoverable failures (DB connection lost)
FATAL: System shutdown events

Log Storage:
├── Application logs → ELK Stack (Elasticsearch)
├── Error logs → Sentry
├── Audit logs → Kafka + Data Lake
└── Performance logs → Prometheus + Grafana
```

### 7.3 Alerting

```
Critical Alerts (Immediate Response):
├── Error rate > 5%
├── Response time p99 > 2000ms
├── Database unavailable
└── Cache hit rate < 50%

Warning Alerts (Within 15 minutes):
├── Error rate > 2%
├── Response time p95 > 1000ms
├── Replication lag > 5 seconds
└── Connection pool > 80% utilized
```

---

## 8. Security Considerations

### 8.1 API Security

```
Authentication: JWT tokens
├── Issued on login
├── TTL: 24 hours
├── Refresh token: 30 days
└── Key rotation: Monthly

Authorization:
├── Role-based access control (RBAC)
├── Doctor: View own slots, create slots
├── Admin: Manage all doctors & slots
└── User: View and book slots

Rate Limiting:
├── Anonymous: 10 req/min per IP
├── Authenticated: 100 req/min per user
└── DDoS protection: 1000 req/sec per IP
```

### 8.2 Database Security

```
Encryption:
├── In-transit: TLS 1.3
├── At-rest: AES-256
└── Backups: Encrypted with KMS

Access Control:
├── DB user: Read-only for replicas
├── DB user: Read-write for primary only
├── Network: IP whitelisting
└── Audit: Log all DDL/DML operations

Backup Strategy:
├── Full backup: Daily (2:00 AM UTC)
├── Incremental: Hourly
├── Retention: 30 days
├── Cross-region: Replicated to secondary region
└── Test restore: Monthly
```

---

## 9. Disaster Recovery & Business Continuity

### 9.1 RTO & RPO Targets

```
RTO (Recovery Time Objective): 15 minutes
RPO (Recovery Point Objective): 5 minutes
```

### 9.2 Failover Plan

```
Database Failover:
1. Monitor primary health (heartbeat every 5s)
2. If 3 consecutive failures (15s), initiate failover
3. Promote replica-1 to primary
4. Update connection strings (via DNS update)
5. Notify ops team

Application Failover:
1. Load balancer health check (every 10s)
2. On failure, remove from rotation
3. Auto-scale up new instance
4. Notify monitoring system
5. Log incident
```

### 9.3 Backup Strategy

```
Backup Schedule:
├── Daily full backup (compressed, ~10GB)
├── Hourly incremental (WAL archiving)
├── Continuous streaming to S3
└── Monthly point-in-time restore test

Backup Locations:
├── Primary: On-premise or AWS EBS
├── Secondary: AWS S3 (cross-region)
└── Tertiary: Cold storage (Glacier)
```

---

## 10. Performance Benchmarks

### 10.1 Expected Throughput

```
Single Node (Current Setup):
├── Concurrent users: 100-500
├── Bookings/sec: 50-100
├── Avg response time: 100-200ms
├── P99 response time: 300-500ms

Scaled Setup (10 nodes + sharding):
├── Concurrent users: 10,000+
├── Bookings/sec: 5,000-10,000
├── Avg response time: 100-200ms
├── P99 response time: 500-1000ms
```

### 10.2 Resource Utilization

```
Per Application Server (Scaled 10 nodes):
├── vCPU: 4 cores
├── RAM: 8 GB
├── Storage: 20 GB (logs)
└── Bandwidth: 1 Gbps

Database (Sharded 4 instances):
├── vCPU: 16 cores (per shard)
├── RAM: 64 GB (per shard)
├── Storage: 500 GB (per shard)
└── Bandwidth: 10 Gbps replication

Cache (Redis Cluster):
├── vCPU: 4 cores
├── RAM: 32 GB (10GB data + overhead)
├── Network: 1 Gbps
└── Replication: Master-slave
```

---

## 11. Deployment Architecture

### 11.1 Development → Production Pipeline

```
Development
    ↓
├─ Unit Tests (Jest)
├─ Integration Tests (DB)
└─ Code Coverage (>80%)
    ↓
Staging
    ├─ E2E Tests (Selenium/Cypress)
    ├─ Load Testing (k6/JMeter)
    ├─ Security Scanning (OWASP)
    └─ Performance Testing
    ↓
Production
    ├─ Blue-Green Deployment
    ├─ Canary Release (10% traffic)
    ├─ Rollback on error
    └─ Post-deployment monitoring
```

### 11.2 Infrastructure as Code

```yaml
# Terraform / CloudFormation
├── VPC (3 AZs)
├── Application Load Balancer
├── Auto Scaling Group (App servers)
├── RDS Multi-AZ (PostgreSQL)
├── ElastiCache (Redis)
├── Route 53 (DNS)
├── CloudFront (CDN)
└── CloudWatch (Monitoring)
```

---

## 12. Future Enhancements

1. **GraphQL API** - For complex queries, reduce over-fetching
2. **Real-time Updates** - WebSocket for live slot availability
3. **ML Recommendations** - Suggest doctors based on history
4. **Payment Integration** - Stripe/Razorpay for paid consultations
5. **Video Consultations** - Integrate Twilio/Agora
6. **Geographic Expansion** - Multi-region deployment
7. **Advanced Analytics** - Business intelligence dashboards
8. **Doctor Availability API** - Calendar integration

---

## Conclusion

This architecture is designed to handle **millions of concurrent users** while maintaining **zero overbooking** through atomic transactions and row-level locking. The system scales horizontally through stateless application servers, vertically through database sharding, and provides resilience through multi-region replication and comprehensive monitoring.

**Key Differentiators:**
- ✅ Race condition prevention via PostgreSQL transactions
- ✅ Automatic booking expiry (2-minute timeout)
- ✅ Distributed caching with Redis
- ✅ Event-driven architecture with message queues
- ✅ Comprehensive monitoring and alerting
- ✅ Disaster recovery with RTO/RPO targets
