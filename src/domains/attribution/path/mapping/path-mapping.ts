/**
 * The path mapping records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path mapping is in its life cycle. */
export type PathMappingStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A path mapping as the path team keeps it. */
export class PathMapping {
  code: string;
  title: string;
  channel: string;
  contactEmail: string;
  openRate: number;
  journeyId: string;
  status: PathMappingStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    contactEmail: string,
    openRate: number,
    journeyId: string,
    status: PathMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.openRate = openRate;
    this.journeyId = journeyId;
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

  canMoveTo(next: PathMappingStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PathMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): PathMapping {
    return new PathMapping(
      this.code,
      this.title,
      this.channel,
      this.contactEmail,
      this.openRate,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a path mapping in status idle. */
export function newPathMapping(code: string, title: string): PathMapping {
  return new PathMapping(code, title, "", "", 0, "", "idle");
}
