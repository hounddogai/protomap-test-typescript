import * as text from "../../../../kit/text.js";

/** Where a double opt in manifest is in its life cycle. */
export type DoubleOptInManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A double opt in manifest as the double opt in team keeps it. */
export class DoubleOptInManifest {
  code: string;
  name: string;
  priority: number;
  utmSource: string;
  region: string;
  revision: number;
  startsAt: number;
  sendAt: number;
  amount: number;
  status: DoubleOptInManifestStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    utmSource: string,
    region: string,
    revision: number,
    startsAt: number,
    sendAt: number,
    amount: number,
    status: DoubleOptInManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.utmSource = utmSource;
    this.region = region;
    this.revision = revision;
    this.startsAt = startsAt;
    this.sendAt = sendAt;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DoubleOptInManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.amount - this.sendAt) * 100) / 100;
  }

  copy(): DoubleOptInManifest {
    return new DoubleOptInManifest(
      this.code,
      this.name,
      this.priority,
      this.utmSource,
      this.region,
      this.revision,
      this.startsAt,
      this.sendAt,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a double opt in manifest in status draft. */
export function newDoubleOptInManifest(code: string, name: string): DoubleOptInManifest {
  return new DoubleOptInManifest(code, name, 0, "", "", 0, 0, 0, 0, "draft");
}
