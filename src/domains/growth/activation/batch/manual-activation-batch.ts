/**
 * The manual activation batch records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual activation batch is in its life cycle. */
export type ManualActivationBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual activation batch. Its code is unique within a tenant. */
export class ManualActivationBatch {
  code: string;
  label: string;
  discount: number;
  attributes: Map<string, string>;
  reviewer: string;
  currency: string;
  revision: number;
  windowDays: number;
  retries: number;
  conversionRate: number;
  audienceId: string;
  status: ManualActivationBatchStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    attributes: Map<string, string>,
    reviewer: string,
    currency: string,
    revision: number,
    windowDays: number,
    retries: number,
    conversionRate: number,
    audienceId: string,
    status: ManualActivationBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.attributes = attributes;
    this.reviewer = reviewer;
    this.currency = currency;
    this.revision = revision;
    this.windowDays = windowDays;
    this.retries = retries;
    this.conversionRate = conversionRate;
    this.audienceId = audienceId;
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

  canMoveTo(next: ManualActivationBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualActivationBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual activation batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"manual activation batch"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round(this.retries * this.revision * 100) / 100;
  }

  copy(): ManualActivationBatch {
    return new ManualActivationBatch(
      this.code,
      this.label,
      this.discount,
      this.attributes,
      this.reviewer,
      this.currency,
      this.revision,
      this.windowDays,
      this.retries,
      this.conversionRate,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual activation batch in status requested. */
export function newManualActivationBatch(code: string, label: string): ManualActivationBatch {
  return new ManualActivationBatch(code, label, 0, new Map<string, string>(), "", "", 0, 0, 0, 0, "", "requested");
}
