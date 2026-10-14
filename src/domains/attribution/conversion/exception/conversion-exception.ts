/**
 * The conversion exception records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion exception is in its life cycle. */
export type ConversionExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A conversion exception as the conversion team keeps it. */
export class ConversionException {
  code: string;
  name: string;
  revision: number;
  segment: string;
  ceiling: number;
  minimum: number;
  title: string;
  contactEmail: string;
  graceDays: number;
  score: number;
  status: ConversionExceptionStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    segment: string,
    ceiling: number,
    minimum: number,
    title: string,
    contactEmail: string,
    graceDays: number,
    score: number,
    status: ConversionExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.segment = segment;
    this.ceiling = ceiling;
    this.minimum = minimum;
    this.title = title;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ConversionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.ceiling - this.revision) * 100) / 100;
  }

  copy(): ConversionException {
    return new ConversionException(
      this.code,
      this.name,
      this.revision,
      this.segment,
      this.ceiling,
      this.minimum,
      this.title,
      this.contactEmail,
      this.graceDays,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a conversion exception in status idle. */
export function newConversionException(code: string, name: string): ConversionException {
  return new ConversionException(code, name, 0, "", 0, 0, "", "", 0, 0, "idle");
}
