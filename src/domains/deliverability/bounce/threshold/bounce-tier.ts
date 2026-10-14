import * as text from "../../../../kit/text.js";

/** Where a bounce tier is in its life cycle. */
export type BounceTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A bounce tier. Its code is unique within a tenant. */
export class BounceTier {
  code: string;
  name: string;
  variant: string;
  maximum: number;
  expiresAt: number;
  status: BounceTierStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    maximum: number,
    expiresAt: number,
    status: BounceTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.maximum = maximum;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: BounceTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BounceTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round(this.expiresAt * this.maximum * 100) / 100;
  }

  copy(): BounceTier {
    return new BounceTier(this.code, this.name, this.variant, this.maximum, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a bounce tier in status draft. */
export function newBounceTier(code: string, name: string): BounceTier {
  return new BounceTier(code, name, "", 0, 0, "draft");
}
