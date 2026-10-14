/**
 * The model digest records of attribution's model work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model digest is in its life cycle. */
export type ModelDigestStatus = "created" | "validated" | "published" | "retired";

/** The record of a model digest and its current status. */
export class ModelDigest {
  code: string;
  name: string;
  retries: number;
  attempts: number;
  reviewer: string;
  weight: number;
  expiresAt: number;
  status: ModelDigestStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    attempts: number,
    reviewer: string,
    weight: number,
    expiresAt: number,
    status: ModelDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.weight = weight;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelDigestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"model digest"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.weight + this.expiresAt) * 100) / 100;
  }

  copy(): ModelDigest {
    return new ModelDigest(
      this.code,
      this.name,
      this.retries,
      this.attempts,
      this.reviewer,
      this.weight,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a model digest in status created. */
export function newModelDigest(code: string, name: string): ModelDigest {
  return new ModelDigest(code, name, 0, 0, "", 0, 0, "created");
}
