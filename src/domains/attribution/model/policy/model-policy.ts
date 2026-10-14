/**
 * The model policy records of attribution's model work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model policy is in its life cycle. */
export type ModelPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A model policy. Its code is unique within a tenant. */
export class ModelPolicy {
  code: string;
  name: string;
  externalRef: string;
  expiresAt: number;
  maximum: number;
  tags: string[];
  weight: number;
  quantity: number;
  region: string;
  margin: number;
  graceDays: number;
  status: ModelPolicyStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    expiresAt: number,
    maximum: number,
    tags: string[],
    weight: number,
    quantity: number,
    region: string,
    margin: number,
    graceDays: number,
    status: ModelPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.maximum = maximum;
    this.tags = tags;
    this.weight = weight;
    this.quantity = quantity;
    this.region = region;
    this.margin = margin;
    this.graceDays = graceDays;
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

  canMoveTo(next: ModelPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ModelPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"model policy"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round((this.expiresAt + this.graceDays) * 100) / 100;
  }

  copy(): ModelPolicy {
    return new ModelPolicy(
      this.code,
      this.name,
      this.externalRef,
      this.expiresAt,
      this.maximum,
      this.tags,
      this.weight,
      this.quantity,
      this.region,
      this.margin,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a model policy in status requested. */
export function newModelPolicy(code: string, name: string): ModelPolicy {
  return new ModelPolicy(code, name, "", 0, 0, [], 0, 0, "", 0, 0, "requested");
}
