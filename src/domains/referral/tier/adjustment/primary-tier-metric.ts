import * as text from "../../../../kit/text.js";

/** Where a primary tier metric is in its life cycle. */
export type PrimaryTierMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary tier metric. Its code is unique within a tenant. */
export class PrimaryTierMetric {
  code: string;
  name: string;
  priority: number;
  revision: number;
  journeyId: string;
  score: number;
  status: PrimaryTierMetricStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    revision: number,
    journeyId: string,
    score: number,
    status: PrimaryTierMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.revision = revision;
    this.journeyId = journeyId;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryTierMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimaryTierMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary tier metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netTotal(): number {
    return Math.round((this.score - this.revision) * 100) / 100;
  }

  copy(): PrimaryTierMetric {
    return new PrimaryTierMetric(
      this.code,
      this.name,
      this.priority,
      this.revision,
      this.journeyId,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary tier metric in status requested. */
export function newPrimaryTierMetric(code: string, name: string): PrimaryTierMetric {
  return new PrimaryTierMetric(code, name, 0, 0, "", 0, "requested");
}
