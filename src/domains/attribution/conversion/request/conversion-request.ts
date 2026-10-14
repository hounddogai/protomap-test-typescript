/**
 * The conversion request records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion request is in its life cycle. */
export type ConversionRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A conversion request as the conversion team keeps it. */
export class ConversionRequest {
  code: string;
  label: string;
  budget: number;
  contactEmail: string;
  score: number;
  title: string;
  campaignRef: string;
  frequencyCap: number;
  revision: number;
  description: string;
  status: ConversionRequestStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    contactEmail: string,
    score: number,
    title: string,
    campaignRef: string,
    frequencyCap: number,
    revision: number,
    description: string,
    status: ConversionRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.score = score;
    this.title = title;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.revision = revision;
    this.description = description;
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

  canMoveTo(next: ConversionRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.revision + this.budget) * 100) / 100;
  }

  copy(): ConversionRequest {
    return new ConversionRequest(
      this.code,
      this.label,
      this.budget,
      this.contactEmail,
      this.score,
      this.title,
      this.campaignRef,
      this.frequencyCap,
      this.revision,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a conversion request in status draft. */
export function newConversionRequest(code: string, label: string): ConversionRequest {
  return new ConversionRequest(code, label, 0, "", 0, "", "", 0, 0, "", "draft");
}
