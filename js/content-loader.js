class ConferenceContent {
  constructor() {
    this.speakers = [];
    this.speakersMap = {};
    this.agenda = { sessions: [], conference: {}, preParty: {} };
    this.sponsors = { list: [], partners: [], tiers: {} };
    this.loaded = false;
  }

  async loadData() {
    if (this.loaded) return;
    try {
      const [speakersRes, agendaRes, sponsorsRes] = await Promise.all([
        fetch("data/speakers.json"),
        fetch("data/agenda.json"),
        fetch("data/sponsors.json"),
      ]);
      if (!speakersRes.ok || !agendaRes.ok || !sponsorsRes.ok) {
        throw new Error("Failed to load one or more data files");
      }
      this.speakers = await speakersRes.json();
      this.agenda = await agendaRes.json();
      this.sponsors = await sponsorsRes.json();
      this.speakersMap = {};
      this.speakers.forEach((speaker) => (this.speakersMap[speaker.id] = speaker));
      this.loaded = true;
    } catch (err) {
      console.error("Error loading content data:", err);
      console.info("Note: This pseudo-CMS requires serving files via HTTP. Run a local server with: python3 -m http.server 8888");
    }
  }

  getSpeaker(id) {
    return this.speakersMap[id] || null;
  }

  getFeaturedSpeakers(limit = 6) {
    return this.speakers
      .filter((speaker) => speaker.featured)
      .sort((a, b) => a.order - b.order)
      .slice(0, limit);
  }

  getAllSpeakers() {
    return this.speakers.sort((a, b) => a.order - b.order);
  }

  // "Past Speakers" archive: anyone who has spoken in 2024 or 2025, regardless
  // of whether they're also confirmed for 2026.
  getPastSpeakers() {
    return this.speakers
      .filter((speaker) => /2024|2025/.test(speaker.year || ""))
      .sort((a, b) => a.order - b.order);
  }

  // Confirmed 2026 lineup, in curated order (falls back to name order if
  // order2026 isn't set on a given record).
  getAllSpeakers2026() {
    return this.speakers
      .filter((speaker) => /2026/.test(speaker.year || ""))
      .sort((a, b) => (a.order2026 || 999) - (b.order2026 || 999));
  }

  getFeaturedSpeakers2026(limit = 6) {
    return this.speakers
      .filter((speaker) => speaker.featured2026)
      .sort((a, b) => (a.order2026 || 999) - (b.order2026 || 999))
      .slice(0, limit);
  }

  getFeaturedSessions(limit = 4) {
    if (this.agenda.days && Array.isArray(this.agenda.days)) {
      return this.agenda.days
        .flatMap((day) => day.sessions.map((session) => ({ ...session, dayTitle: day.title, dayDate: day.date })))
        .filter((session) => session.type === "keynote" || session.type === "panel")
        .slice(0, limit);
    }
    return this.agenda.sessions.filter((session) => session.featured && session.type !== "break").slice(0, limit);
  }

  // Curated preview of flagship talks from the confirmed 2026 agenda (see data/agenda.json > mainStage2026).
  getMainStage2026Sessions() {
    return this.agenda.mainStage2026 || [];
  }

  getAllSessions() {
    if (this.agenda.days && Array.isArray(this.agenda.days)) {
      return this.agenda.days.flatMap((day) =>
        day.sessions.map((session) => ({ ...session, dayTitle: day.title, dayDate: day.date }))
      );
    }
    return this.agenda.sessions;
  }

  getSessionsByTrack(track) {
    return this.getAllSessions().filter((session) => session.track === track);
  }

  getAllDays() {
    return this.agenda.days || [];
  }

  getSponsorsByTier(tier) {
    return this.sponsors.list.filter((sponsor) => sponsor.tier === tier);
  }

  getFeaturedSponsors() {
    return this.sponsors.list.filter((sponsor) => sponsor.featured);
  }

  getPartners() {
    return this.sponsors.partners || [];
  }

  // Confirmed 2026 sponsor lineup, in the curated order supplied by Spring Labs.
  getSponsors2026() {
    return this.sponsors.list2026 || [];
  }

  // Zomma doesn't have a downloadable logo asset (their brand is a lowercase
  // text wordmark), so render it as styled text instead of an <img>.
  renderSponsorMark2026(sponsor, style) {
    if (!sponsor.logo) {
      return `<span style="font-family: 'Inter', sans-serif; font-weight: 700; font-size: 1.75rem; letter-spacing: -0.02em; color: #1a1a2e; text-transform: lowercase;">${sponsor.name}</span>`;
    }
    return `<img loading="lazy" src="${sponsor.logo}" alt="${sponsor.name}" style="${style}">`;
  }

  renderSponsorCard2026(sponsor) {
    const mark = this.renderSponsorMark2026(sponsor, "max-height: 70px; max-width: 100%; object-fit: contain;");
    const inner = `
      <div class="sponsor-2026-card" style="display: flex; align-items: center; justify-content: center; height: 130px; padding: 1.5rem; background: #fff; border: 1px solid #eee; border-radius: 12px; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;">
        ${mark}
      </div>
    `;
    return sponsor.website
      ? `<a href="${sponsor.website}" target="_blank" rel="noopener noreferrer" title="${sponsor.name}" style="text-decoration: none; display: block;">${inner}</a>`
      : inner;
  }

  renderHomepageSponsors2026() {
    const sponsors = this.getSponsors2026();
    return sponsors.map((sponsor) => this.renderSponsorCard2026(sponsor)).join("");
  }

  renderSpeakerCard(speaker) {
    return `
      <div class="speaker-card">
        <img src="${speaker.photo}" alt="${speaker.name}" loading="lazy">
        <h4>${speaker.name}</h4>
        <div class="position">${speaker.title}${speaker.company ? ", " + speaker.company : ""}</div>
        ${speaker.linkedin ? `<a href="${speaker.linkedin}" target="_blank" class="linkedin-link"><img src="images/LinkedIn.svg" alt="LinkedIn"></a>` : ""}
      </div>
    `;
  }

  renderSpeakerMini(speakerId, isModerator = false) {
    const speaker = this.getSpeaker(speakerId);
    if (!speaker) return "";
    return `
      <div class="speaker-mini">
        <img src="${speaker.photo}" alt="${speaker.name}" loading="lazy">
        <div class="speaker-mini-info">
          ${isModerator ? '<div class="moderator-tag">Moderator</div>' : ""}
          <div class="speaker-mini-name">${speaker.name}</div>
          <div class="speaker-mini-title">${speaker.title}${speaker.company ? ", " + speaker.company : ""}</div>
        </div>
      </div>
    `;
  }

  renderFeaturedSpeakerCard(speaker, href = "speakers.html") {
    return `
      <a href="${href}" class="portrait-image-wrap" style="position: relative; display: block; aspect-ratio: 3/4; overflow: hidden; border-radius: 8px;">
        <img loading="lazy" src="${speaker.photo}" alt="${speaker.name}" class="absolute-image" style="width: 100%; height: 100%; object-fit: cover;">
        <div class="speaker-details-wrap" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 1rem; color: white;">
          <h4 class="speaker-name-in-card" style="margin: 0; font-size: 1rem; color: white;">${speaker.name}</h4>
          <div class="company-and-position-wrap" style="font-size: 0.8rem; opacity: 0.9;">
            <span>${speaker.title}${speaker.company ? " at " + speaker.company : ""}</span>
          </div>
        </div>
      </a>
    `;
  }

  renderAgendaItem(session) {
    const guestIds = [...(session.speakers || [])];
    if (session.moderator) guestIds.push(session.moderator);

    let guestsHtml = "";
    if (guestIds.length > 0) {
      guestsHtml = `<div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem;">${guestIds
        .map((id) => {
          const speaker = this.getSpeaker(id);
          return speaker
            ? `
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${speaker.photo}" alt="${speaker.name}" 
                 style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; color: #333;">${speaker.name}</div>
              <div style="font-size: 0.8rem; color: #666;">${speaker.title}${speaker.company ? ", " + speaker.company : ""}</div>
            </div>
          </div>
        `
            : "";
        })
        .join("")}</div>`;
    }

    const typeBadge =
      session.type === "keynote"
        ? '<span style="background: #e74c3c; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">KEYNOTE</span>'
        : session.type === "panel"
        ? '<span style="background: #3498db; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">PANEL</span>'
        : "";

    return `
      <a href="events.html" class="homepage-agenda-item" style="display: block; margin-bottom: 1.5rem; padding: 1.5rem; background: #f9f9f9; border-radius: 12px; text-decoration: none; color: inherit; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid transparent;">
        <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
          <div style="min-width: 80px; text-align: center;">
            <div style="font-weight: 700; font-size: 1.1rem; color: #e74c3c;">${session.time}</div>
            ${session.duration ? `<div style="font-size: 0.75rem; color: #999; margin-top: 0.25rem;">${session.duration}</div>` : ""}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; flex-wrap: wrap;">
              <h3 style="margin: 0; font-size: 1.25rem; color: #222;">${session.title}</h3>
              ${typeBadge}
            </div>
            ${session.description ? `<p style="margin: 0.5rem 0 0; color: #666; font-size: 0.95rem; line-height: 1.5;">${session.description}</p>` : ""}
            ${guestsHtml}
          </div>
        </div>
      </a>
    `;
  }

  renderMainStage2026Card(session) {
    const guestIds = [...(session.speakers || [])];
    if (session.moderator) guestIds.push(session.moderator);
    const guests = [];
    guestIds.forEach((id) => {
      let speaker = this.getSpeaker(id);
      if (speaker) {
        guests.push(speaker);
      } else {
        const namePart = id.split(" - ")[0];
        speaker = this.speakers.find((s) => s.name === namePart);
        if (speaker) guests.push(speaker);
      }
    });

    const accentByType = {
      keynote: "#e1614b",
      panel: "#1a1a2e",
      fireside: "#c08a1e",
      "case-study": "#1c7a6e",
    };
    const accent = accentByType[session.type] || "#1a1a2e";

    const eyebrow = `
      <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 0.6rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 1rem;">
        ${session.tag ? `<span style="color: ${accent};">${session.tag}</span>` : ""}
        ${session.tag && session.time ? `<span style="color: #ccc;">&middot;</span>` : ""}
        ${session.time ? `<span style="color: #888; font-weight: 600; letter-spacing: 0.02em; text-transform: none;">${session.time}</span>` : ""}
      </div>
    `;

    let guestsHtml = "";
    if (guests.length > 0) {
      guestsHtml = `
        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid #eee; display: flex; align-items: center; gap: 0.9rem;">
          <div style="display: flex; padding-left: 12px; flex-shrink: 0;">${guests
            .slice(0, 4)
            .map(
              (speaker) => `
        <img src="${speaker.photo}" alt="${speaker.name}" 
             style="width: 46px; height: 46px; min-width: 46px; flex-shrink: 0; border-radius: 50%; object-fit: cover; border: 3px solid white; margin-left: -12px; box-shadow: 0 2px 6px rgba(0,0,0,0.12);"
             title="${speaker.name}">
      `
            )
            .join("")}</div>
          <div style="font-size: 0.88rem; color: #444; line-height: 1.4; min-width: 0;">
            <div style="font-weight: 600; color: #1a1a2e;">${guests
              .slice(0, 3)
              .map((speaker) => speaker.name)
              .join(", ")}${guests.length > 3 ? ` <span style="color: #999; font-weight: 500;">+${guests.length - 3} more</span>` : ""}</div>
          </div>
        </div>
      `;
    }

    return `
      <a href="agenda.html" style="display: flex; flex-direction: column; height: 100%; background: white; border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #eee; border-top: 4px solid ${accent};" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)';">
        <div style="padding: 1.75rem 1.5rem; display: flex; flex-direction: column; flex: 1;">
          ${eyebrow}
          <h4 style="margin: 0; font-size: 1.3rem; line-height: 1.38; font-weight: 600; color: #1a1a2e; flex: 1;">${session.title}</h4>
          ${guestsHtml}
        </div>
      </a>
    `;
  }

  renderSessionBlock(session) {
    const typeClass = session.type === "keynote" ? "keynote" : session.type === "break" ? "break" : "";
    if (session.type === "break") {
      return `
        <div class="session-block break">
          <div class="session-time">${session.time}${session.endTime ? " - " + session.endTime : session.duration ? " • " + session.duration : ""}</div>
          <div class="session-title">${session.title}</div>
        </div>
      `;
    }
    let guestsHtml = "";
    if (session.speakers && session.speakers.length > 0) {
      guestsHtml = session.speakers.map((id) => this.renderSpeakerMini(id)).join("");
    }
    if (session.moderator) {
      guestsHtml += this.renderSpeakerMini(session.moderator, true);
    }
    return `
      <div class="session-block ${typeClass}">
        <div class="session-time">${session.time}${session.duration ? " • " + session.duration : ""}</div>
        <div class="session-title">${session.title}</div>
        ${session.description ? `<div class="session-description">${session.description}</div>` : ""}
        ${guestsHtml ? `<div class="session-speakers">${guestsHtml}</div>` : ""}
      </div>
    `;
  }

  renderParallelTracks(aiNativeSession, complianceSession) {
    const renderTrackContent = (session) => {
      if (!session) return '<div class="track-content"><p>Session TBD</p></div>';
      let guestsHtml = "";
      if (session.speakers && session.speakers.length > 0) {
        guestsHtml = '<div class="session-speakers">' + session.speakers.map((id) => this.renderSpeakerMini(id)).join("") + "</div>";
      }
      if (session.moderator) {
        guestsHtml += this.renderSpeakerMini(session.moderator, true);
      }
      return `
        <div class="track-content">
          <div class="track-title">${session.title}</div>
          ${session.description ? `<div class="track-description">${session.description}</div>` : ""}
          ${guestsHtml}
        </div>
      `;
    };

    return `
      <div class="session-block" style="background: transparent; border: none; padding: 0;">
        <div class="session-time" style="margin-bottom: 1rem;">${aiNativeSession?.time || complianceSession?.time}${aiNativeSession?.duration ? " • " + aiNativeSession.duration : ""}</div>
        <div class="tracks-container">
          <div class="track">
            <div class="track-header ai-native">AI-Native Stage</div>
            ${renderTrackContent(aiNativeSession)}
          </div>
          <div class="track">
            <div class="track-header compliance">Tech & Compliance Stage</div>
            ${renderTrackContent(complianceSession)}
          </div>
        </div>
      </div>
    `;
  }

  renderSponsorLogo(sponsor, grayscale = false) {
    const tierConfig = this.sponsors.tiers[sponsor.tier] || {};
    const style = grayscale
      ? `max-height: ${tierConfig.logoHeight || "80px"}; max-width: ${tierConfig.logoMaxWidth || "200px"}; object-fit: contain; filter: grayscale(100%); transition: filter 0.3s;`
      : `max-height: ${tierConfig.logoHeight || "80px"}; max-width: ${tierConfig.logoMaxWidth || "200px"}; object-fit: contain;`;
    const hoverHandlers = grayscale ? "onmouseover=\"this.style.filter='grayscale(0%)'\" onmouseout=\"this.style.filter='grayscale(100%)'\"" : "";

    if (sponsor.id === "spring-labs") {
      const inner = `
        <div style="display: flex; align-items: center; gap: 1.5rem; justify-content: center;">
          <img loading="lazy" src="${sponsor.logo}" alt="${sponsor.name}" style="${style}" ${hoverHandlers}>
          <span style="font-size: 2.5rem; font-weight: 900; letter-spacing: 0.15em; color: #222; font-family: 'Inter', sans-serif;">SPRING LABS</span>
        </div>
      `;
      return sponsor.website ? `<a href="${sponsor.website}" target="_blank" style="text-decoration: none;">${inner}</a>` : inner;
    }
    return sponsor.website
      ? `<a href="${sponsor.website}" target="_blank"><img loading="lazy" src="${sponsor.logo}" alt="${sponsor.name}" style="${style}" ${hoverHandlers}></a>`
      : `<img loading="lazy" src="${sponsor.logo}" alt="${sponsor.name}" style="${style}" ${hoverHandlers}>`;
  }

  renderSponsorTier(tierKey) {
    const tierConfig = this.sponsors.tiers[tierKey];
    const sponsorsInTier = this.getSponsorsByTier(tierKey);
    if (!sponsorsInTier.length || tierConfig.hidden) return "";
    return `
      <div class="sponsor-tier">
        <h2 class="font-color-accent">${tierConfig.name}</h2>
        <div class="sponsor-logos ${tierKey}">
          ${sponsorsInTier.map((sponsor) => this.renderSponsorLogo(sponsor)).join("")}
        </div>
      </div>
    `;
  }

  renderPartnersSection() {
    const partners = this.getPartners();
    return partners.length
      ? `
      <div class="sponsor-tier">
        <h2 class="font-color-accent">Bank Association Partners</h2>
        <div class="partner-logos" style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 2rem; margin-top: 1.5rem;">
          ${partners.map((partner) => `<img loading="lazy" src="${partner.logo}" alt="${partner.name}" style="max-height: 60px; max-width: 180px; object-fit: contain;">`).join("")}
        </div>
      </div>
    `
      : "";
  }

  renderHomepageSponsors() {
    const logos = (this.sponsors.list || [])
      .map((sponsor) =>
        sponsor.website
          ? `<a href="${sponsor.website}" target="_blank" style="display: flex; align-items: center; justify-content: center; height: 60px; min-width: 120px; padding: 0 1.5rem;">
             <img loading="lazy" src="${sponsor.logo}" alt="${sponsor.name}" style="max-height: 50px; max-width: 140px; object-fit: contain; filter: grayscale(100%); opacity: 0.7; transition: all 0.3s;" onmouseover="this.style.filter='grayscale(0%)'; this.style.opacity='1';" onmouseout="this.style.filter='grayscale(100%)'; this.style.opacity='0.7';">
           </a>`
          : `<div style="display: flex; align-items: center; justify-content: center; height: 60px; min-width: 120px; padding: 0 1.5rem;">
             <img loading="lazy" src="${sponsor.logo}" alt="${sponsor.name}" style="max-height: 50px; max-width: 140px; object-fit: contain; filter: grayscale(100%); opacity: 0.7; transition: all 0.3s;" onmouseover="this.style.filter='grayscale(0%)'; this.style.opacity='1';" onmouseout="this.style.filter='grayscale(100%)'; this.style.opacity='0.7';">
           </div>`
      )
      .join("");
    const track = logos + logos;
    const styleId = "sponsor-carousel-styles";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = `
        @keyframes sponsor-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .sponsor-carousel-track {
          display: flex;
          animation: sponsor-scroll 30s linear infinite;
          width: max-content;
        }
        .sponsor-carousel-track:hover {
          animation-play-state: paused;
        }
        .sponsor-carousel-wrapper {
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
        }
      `;
      document.head.appendChild(styleEl);
    }
    return `
      <div class="sponsor-carousel-wrapper" style="width: 100%; overflow: hidden;">
        <div class="sponsor-carousel-track">
          ${track}
        </div>
      </div>
    `;
  }

  async renderAll() {
    await this.loadData();
    if (!this.loaded) {
      console.error("Cannot render - data not loaded");
      return;
    }

    const agendaEl = document.querySelector('[data-content="agenda"]');
    if (agendaEl) {
      const mainStageSessions = this.getMainStage2026Sessions();
      agendaEl.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; align-items: stretch;">
          ${mainStageSessions.map((session) => this.renderMainStage2026Card(session)).join("")}
        </div>
        <style>
          @media (max-width: 1200px) {
            [data-content="agenda"] > div { grid-template-columns: repeat(3, 1fr) !important; }
          }
          @media (max-width: 900px) {
            [data-content="agenda"] > div { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 600px) {
            [data-content="agenda"] > div { grid-template-columns: 1fr !important; }
          }
        </style>
      `;
    }

    // Homepage teaser: confirmed 2026 speakers, linking through to the 2026 lineup page.
    const speakersTeaserEl = document.querySelector('[data-content="speakers"]');
    if (speakersTeaserEl) {
      const limit = parseInt(speakersTeaserEl.dataset.limit) || 6;
      const featured2026 = this.getFeaturedSpeakers2026(limit);
      speakersTeaserEl.innerHTML = featured2026.map((speaker) => this.renderFeaturedSpeakerCard(speaker, "speakers-2026.html")).join("");
    }

    const sponsorsEl = document.querySelector('[data-content="sponsors"]');
    if (sponsorsEl) {
      sponsorsEl.innerHTML = this.renderHomepageSponsors();
    }

    // Homepage "2026 Sponsors" grid.
    const sponsors2026El = document.querySelector('[data-content="sponsors-2026"]');
    if (sponsors2026El) {
      sponsors2026El.innerHTML = this.renderHomepageSponsors2026();
    }

    // Full 2026 Sponsors page grid.
    const sponsors2026GridEl = document.querySelector('[data-content="sponsors-2026-grid"]');
    if (sponsors2026GridEl) {
      sponsors2026GridEl.innerHTML = this.renderHomepageSponsors2026();
    }

    // Past Speakers archive page (2024/2025 alumni).
    const pastSpeakersGridEl = document.querySelector('[data-content="speakers-grid"]');
    if (pastSpeakersGridEl) {
      const pastSpeakers = this.getPastSpeakers();
      pastSpeakersGridEl.innerHTML = pastSpeakers.map((speaker) => this.renderSpeakerCard(speaker)).join("");
    }

    // 2026 Speakers lineup page.
    const speakers2026GridEl = document.querySelector('[data-content="speakers-2026-grid"]');
    if (speakers2026GridEl) {
      const speakers2026 = this.getAllSpeakers2026();
      speakers2026GridEl.innerHTML = speakers2026.map((speaker) => this.renderSpeakerCard(speaker)).join("");
    }

    const sponsorsTiersEl = document.querySelector('[data-content="sponsors-tiers"]');
    if (sponsorsTiersEl) {
      sponsorsTiersEl.innerHTML =
        this.renderSponsorTier("host") +
        this.renderPartnersSection() +
        this.renderSponsorTier("platinum") +
        this.renderSponsorTier("gold") +
        this.renderSponsorTier("startup");
    }

    const partnersEl = document.querySelector('[data-content="partners"]');
    if (partnersEl) {
      const partners = this.getPartners();
      partnersEl.innerHTML = partners
        .map((partner) => `<img loading="lazy" src="${partner.logo}" alt="${partner.name}" style="max-height: 60px; max-width: 180px; object-fit: contain;">`)
        .join("");
    }

    const agendaFullEl = document.querySelector('[data-content="agenda-full"]');
    if (agendaFullEl) {
      agendaFullEl.innerHTML = this.renderFullAgenda();
    }
  }

  renderDaySession(session) {
    const typeClass = session.type === "keynote" ? "keynote" : session.type === "break" ? "break" : "";
    if (session.type === "break") {
      return `
        <div class="session-block break">
          <div class="session-time">${session.time}</div>
          <div class="session-title">${session.title}</div>
        </div>
      `;
    }
    let guestsHtml = "";
    if (session.speakers && session.speakers.length > 0) {
      guestsHtml = `<div class="session-speakers" style="margin-top: 0.75rem;">
        ${session.speakers.map((name) => `<div style="font-size: 0.9rem; color: #666;">• ${name}</div>`).join("")}
      </div>`;
    }
    if (session.moderator) {
      guestsHtml += `<div style="font-size: 0.9rem; color: #007bff; margin-top: 0.25rem;">Moderated by: ${session.moderator}</div>`;
    }
    const trackBadge = session.track
      ? `<span style="font-size: 0.75rem; background: ${session.track.includes("AI") ? "#007bff" : "#28a745"}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">${session.track}</span>`
      : "";
    return `
      <div class="session-block ${typeClass}">
        <div class="session-time">${session.time}${session.duration ? " • " + session.duration : ""}</div>
        <div class="session-title">${session.title}${trackBadge}</div>
        ${guestsHtml}
      </div>
    `;
  }

  renderFullAgenda() {
    const days = this.getAllDays();
    if (days.length > 0) {
      let html = `
        <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem; flex-wrap: wrap;">
          ${days
            .map(
              (day, index) => `
            <button onclick="document.getElementById('day-${day.id}').scrollIntoView({behavior: 'smooth'})" 
                    class="button ${index === 0 ? "" : "secondary"} w-button" 
                    style="min-width: 180px;">
              ${day.title}<br><span style="font-size: 0.8rem; opacity: 0.9;">${day.date}</span>
            </button>
          `
            )
            .join("")}
        </div>
      `;

      days.forEach((day) => {
        html += `
          <div id="day-${day.id}" style="scroll-margin-top: 100px;">
            <div class="agenda-section-header" style="display: flex; justify-content: space-between; align-items: center;">
              <span>${day.title}: ${day.date}</span>
              <span style="font-size: 0.9rem; font-weight: normal;">${day.attendees} attendees • ${day.location}</span>
            </div>
        `;

        const sessionsByTime = {};
        day.sessions.forEach((session) => {
          if (!sessionsByTime[session.time]) sessionsByTime[session.time] = [];
          sessionsByTime[session.time].push(session);
        });

        const renderedKeys = new Set();
        day.sessions.forEach((session) => {
          if (renderedKeys.has(session.time + (session.track || ""))) return;
          const sessionsAtTime = sessionsByTime[session.time];
          const aiNativeSession = sessionsAtTime.find((s) => s.track && (s.track.includes("AI-Native") || s.track === "AI-Native Stage"));
          const complianceSession = sessionsAtTime.find((s) => s.track && s.track.includes("Compliance"));
          const mainStageSession = sessionsAtTime.find((s) => s.track === "Main Stage");
          const caseStudiesSession = sessionsAtTime.find((s) => s.track === "Case Studies Stage");

          if (sessionsAtTime.length > 1 && aiNativeSession && complianceSession) {
            html += `
              <div class="session-block" style="background: transparent; border: none; padding: 0;">
                <div class="session-time" style="margin-bottom: 1rem;">${session.time}${session.duration ? " • " + session.duration : ""}</div>
                <div class="tracks-container">
                  <div class="track">
                    <div class="track-header ai-native">${aiNativeSession.track}</div>
                    <div class="track-content">
                      <div class="track-title">${aiNativeSession.title}</div>
                      ${aiNativeSession.speakers ? `<div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">${aiNativeSession.speakers.join(", ")}</div>` : ""}
                    </div>
                  </div>
                  <div class="track">
                    <div class="track-header compliance">${complianceSession.track}</div>
                    <div class="track-content">
                      <div class="track-title">${complianceSession.title}</div>
                      ${complianceSession.speakers ? `<div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">${complianceSession.speakers.join(", ")}</div>` : ""}
                    </div>
                  </div>
                </div>
              </div>
            `;
            renderedKeys.add(session.time + (aiNativeSession.track || ""));
            renderedKeys.add(session.time + (complianceSession.track || ""));
          } else if (sessionsAtTime.length > 1 && mainStageSession && caseStudiesSession) {
            html += `
              <div class="session-block" style="background: transparent; border: none; padding: 0;">
                <div class="session-time" style="margin-bottom: 1rem;">${session.time}${session.duration ? " • " + session.duration : ""}</div>
                <div class="tracks-container">
                  <div class="track">
                    <div class="track-header" style="background: #dc3545;">${mainStageSession.track}</div>
                    <div class="track-content">
                      <div class="track-title">${mainStageSession.title}</div>
                      ${mainStageSession.speakers ? `<div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">${mainStageSession.speakers.join(", ")}</div>` : ""}
                      ${mainStageSession.moderator ? `<div style="margin-top: 0.25rem; font-size: 0.85rem; color: #007bff;">Moderated by: ${mainStageSession.moderator}</div>` : ""}
                    </div>
                  </div>
                  <div class="track">
                    <div class="track-header" style="background: #e91e9e;">${caseStudiesSession.track}</div>
                    <div class="track-content">
                      <div class="track-title">${caseStudiesSession.title}</div>
                      ${caseStudiesSession.speakers ? `<div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">${caseStudiesSession.speakers.join(", ")}</div>` : ""}
                      ${caseStudiesSession.moderator ? `<div style="margin-top: 0.25rem; font-size: 0.85rem; color: #007bff;">Moderated by: ${caseStudiesSession.moderator}</div>` : ""}
                    </div>
                  </div>
                </div>
              </div>
            `;
            renderedKeys.add(session.time + (mainStageSession.track || ""));
            renderedKeys.add(session.time + (caseStudiesSession.track || ""));
          } else {
            html += this.renderDaySession(session);
            renderedKeys.add(session.time + (session.track || ""));
          }
        });

        if (day.demoRoom && day.demoRoom.length > 0) {
          html += `
            <div style="margin-top: 2rem; padding: 1.5rem; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 12px; color: white;">
              <h3 style="margin: 0 0 1rem 0; color: white; display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.5rem;">🎯</span> Demo Room
              </h3>
              <p style="margin: 0 0 1rem 0; opacity: 0.9; font-size: 0.9rem;">7-minute demos from innovative fintech startups</p>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                ${day.demoRoom
                  .map(
                    (demo) => `
                  <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px;">
                    <div style="font-size: 0.8rem; opacity: 0.8;">${demo.time}</div>
                    <div style="font-weight: 600; margin: 0.25rem 0;">${demo.title}</div>
                    <div style="font-size: 0.85rem; opacity: 0.9;">${demo.speaker || (demo.speakers ? demo.speakers.join(", ") : "")}</div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `;
        }

        if (day.deepDiveRoundtables && day.deepDiveRoundtables.length > 0) {
          html += `
            <div style="margin-top: 2rem; padding: 1.5rem; background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); border-radius: 12px; color: #333;">
              <h3 style="margin: 0 0 1rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.5rem;">🔒</span> Deep Dive Roundtables <span style="font-size: 0.8rem; font-weight: normal;">(By Invitation Only)</span>
              </h3>
              <p style="margin: 0 0 1rem 0; font-size: 0.9rem;">Private roundtable discussions sponsored by industry leaders</p>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem;">
                ${day.deepDiveRoundtables
                  .map(
                    (roundtable) => `
                  <div style="background: rgba(255,255,255,0.5); padding: 1rem; border-radius: 8px;">
                    <div style="font-size: 0.8rem; color: #666;">${roundtable.time} • ${roundtable.duration} • ${roundtable.location}</div>
                    <div style="font-weight: 600; margin: 0.5rem 0;">${roundtable.title}</div>
                    <div style="font-size: 0.85rem; color: #555;">${roundtable.speakers.join(", ")}</div>
                    ${roundtable.sponsor ? `<div style="font-size: 0.8rem; margin-top: 0.5rem; color: #007bff;">Sponsored by ${roundtable.sponsor}</div>` : ""}
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `;
        }

        html += "</div>";
      });

      const preParty = this.agenda.preParty;
      if (preParty && preParty.name) {
        html += `
          <div class="pre-party-section">
            <h2>${preParty.name}</h2>
            <p><strong>${preParty.date} • ${preParty.time}</strong></p>
            <p>${preParty.description}</p>
            <a href="tickets.html" class="button secondary-white w-button" style="margin-top: 1rem;">Register</a>
            ${preParty.image ? `<img src="${preParty.image}" alt="${preParty.name}" loading="lazy">` : ""}
          </div>
        `;
      }
      return html;
    }

    // Legacy flat-sessions fallback (no `days` structure in agenda.json).
    const allSessions = this.getAllSessions();
    let html = "";
    let currentSection = "";
    const sessionsByTime = {};
    allSessions.forEach((session) => {
      if (!sessionsByTime[session.time]) sessionsByTime[session.time] = [];
      sessionsByTime[session.time].push(session);
    });

    const renderedKeys = new Set();
    allSessions.forEach((session) => {
      if (renderedKeys.has(session.time + session.track)) return;
      const time = session.time;
      if (time.includes("8:00") || time.includes("9:00")) {
        if (currentSection !== "morning") {
          html += '<div class="agenda-section-header">Morning Session</div>';
          currentSection = "morning";
        }
      } else if (time.includes("12:45") && currentSection !== "afternoon") {
        html += '<div class="agenda-section-header">Afternoon Session</div>';
        currentSection = "afternoon";
      }
      const sessionsAtTime = sessionsByTime[session.time];
      const aiNativeSession = sessionsAtTime.find((s) => s.track === "ai-native");
      const complianceSession = sessionsAtTime.find((s) => s.track === "compliance");
      if (aiNativeSession && complianceSession) {
        html += this.renderParallelTracks(aiNativeSession, complianceSession);
        renderedKeys.add(session.time + "ai-native");
        renderedKeys.add(session.time + "compliance");
      } else if (!session.track) {
        html += this.renderSessionBlock(session);
        renderedKeys.add(session.time + session.track);
      }
    });

    const preParty = this.agenda.preParty;
    if (preParty && preParty.name) {
      html += `
        <div class="pre-party-section">
          <h2>${preParty.name}</h2>
          <p><strong>${preParty.date} • ${preParty.time}</strong></p>
          <p>${preParty.description}</p>
          ${preParty.sponsor ? `<p style="margin-top: 1rem; font-size: 0.9rem;">Thanks to <strong>${preParty.sponsor}</strong> for sponsoring</p>` : ""}
          <a href="tickets.html" class="button secondary-white w-button" style="margin-top: 1rem;">Register Now</a>
          ${preParty.image ? `<img src="${preParty.image}" alt="${preParty.name}" loading="lazy">` : ""}
        </div>
      `;
    }
    return html;
  }

  getNavConfig() {
    return [
      { href: "venue.html", label: "Venue" },
      { href: "agenda.html", label: "Agenda" },
      { href: "speakers-2026.html", label: "Speakers" },
      { href: "sponsors-2026.html", label: "Sponsors" },
      {
        label: "Previous Years",
        children: [
          { href: "events.html", label: "Past Sessions" },
          { href: "speakers.html", label: "Past Speakers" },
          { href: "sponsors.html", label: "Past Sponsors" },
        ],
      },
      { href: "tickets.html", label: "Register", isButton: true },
    ];
  }

  getNavbarConfig() {
    return {
      logo: {
        src: "images/conference_logo_black_v3_o.svg",
        alt: "AI-Native Banking & Fintech Conference",
        href: "index.html",
      },
      lottieMenu: {
        src: "documents/lottieflow-menu-nav-08-000000-easey.json",
      },
    };
  }

  // Injects the CSS for the "Previous Years" nav dropdown once per page load.
  injectNavDropdownStyles() {
    const styleId = "nav-dropdown-styles";
    if (document.getElementById(styleId)) return;
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.textContent = `
      .nav-dropdown { position: relative; display: inline-flex; align-items: center; }
      .nav-dropdown-toggle { background: none; border: none; font: inherit; font-size: 0.875rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
      .nav-menu .w-nav-link:not(.nav-dropdown-toggle) { font-size: 1rem; }
      .nav-dropdown-caret { font-size: 0.65em; transition: transform 0.2s ease; }
      .nav-dropdown.nav-dropdown-open .nav-dropdown-caret { transform: rotate(180deg); }
      .nav-dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        min-width: 200px;
        background-color: var(--white);
        border-radius: 8px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        padding: 12px 8px 8px;
        margin-top: 0;
        display: none;
        flex-direction: column;
        gap: 2px;
        z-index: 1000;
      }
      .nav-dropdown.nav-dropdown-open .nav-dropdown-menu { display: flex; }
      .nav-dropdown-link {
        padding: 10px 14px;
        border-radius: 6px;
        color: var(--black);
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 0.8rem;
        white-space: nowrap;
      }
      .nav-dropdown-link:hover { background-color: var(--white-smoke); }
      .nav-dropdown-link.w--current { color: var(--accent); font-weight: 500; }
      @media (hover: hover) {
        .nav-dropdown:hover .nav-dropdown-menu { display: flex; }
      }
      @media screen and (max-width: 991px) {
        .nav-dropdown { display: block; width: 100%; }
        .nav-dropdown-toggle { width: 100%; justify-content: center; }
        .nav-dropdown-menu { position: static; box-shadow: none; margin-top: 0; padding: 0; }
        .nav-dropdown-link { text-align: center; }
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Wires up click-to-toggle behavior for any "Previous Years"-style nav dropdowns.
  // Safe to call repeatedly (e.g. after re-rendering the nav menu).
  setupNavDropdowns() {
    document.querySelectorAll(".nav-dropdown-toggle").forEach((toggle) => {
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const dropdown = toggle.closest(".nav-dropdown");
        const isOpen = dropdown.classList.contains("nav-dropdown-open");
        document.querySelectorAll(".nav-dropdown-open").forEach((el) => el.classList.remove("nav-dropdown-open"));
        if (!isOpen) dropdown.classList.add("nav-dropdown-open");
        toggle.setAttribute("aria-expanded", String(!isOpen));
      });
    });
    if (!this._navDropdownOutsideClickBound) {
      document.addEventListener("click", () => {
        document.querySelectorAll(".nav-dropdown-open").forEach((el) => el.classList.remove("nav-dropdown-open"));
      });
      this._navDropdownOutsideClickBound = true;
    }
  }

  renderNavLinks(navItems, currentPage) {
    return navItems
      .map((item) => {
        if (item.children) {
          const isGroupCurrent = item.children.some((child) => child.href === currentPage);
          const childrenHtml = item.children
            .map((child) => {
              const isCurrent = currentPage === child.href;
              return `<a href="${child.href}" class="nav-dropdown-link${isCurrent ? " w--current" : ""}"${isCurrent ? ' aria-current="page"' : ""}>${child.label}</a>`;
            })
            .join("");
          return `
        <div class="nav-dropdown">
          <button type="button" class="nav-link w-nav-link nav-dropdown-toggle${isGroupCurrent ? " w--current" : ""}" aria-haspopup="true" aria-expanded="false">
            ${item.label}
            <span class="nav-dropdown-caret" aria-hidden="true">&#9662;</span>
          </button>
          <div class="nav-dropdown-menu">${childrenHtml}</div>
        </div>
      `;
        }
        const isCurrent = currentPage === item.href;
        const linkClass = item.isButton ? "button in-navbar w-nav-link" : "nav-link w-nav-link" + (isCurrent ? " w--current" : "");
        const ariaCurrent = isCurrent ? ' aria-current="page"' : "";
        return `<a href="${item.href}" class="${linkClass}"${ariaCurrent}>${item.label}</a>`;
      })
      .join("\n          ");
  }

  renderNavbar() {
    const navbarConfig = this.getNavbarConfig();
    const navItems = this.getNavConfig();
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const isHome = currentPage === "index.html" || currentPage === "";
    const navLinksHtml = this.renderNavLinks(navItems, currentPage);

    return `
  <div data-animation="default" data-collapse="medium" data-duration="400" data-easing="ease" data-easing2="ease" role="banner" class="navbar w-nav">
    <div class="container in-navbar w-container">
      <div id="w-node-_67248cc2-59d7-39cb-4bc0-0f227731c77f-7731c77d" class="navbar-wrapper">
        <a href="${navbarConfig.logo.href}"${isHome ? ' aria-current="page"' : ""} class="brand w-nav-brand${isHome ? " w--current" : ""}" style="display: flex !important; float: none !important; min-width: 180px;"><img src="${navbarConfig.logo.src}" loading="eager" alt="${navbarConfig.logo.alt}" class="brand-logo" style="max-height: 56px; width: auto;"></a>
        <nav role="navigation" class="nav-menu w-nav-menu">
          ${navLinksHtml}
        </nav>
        <div class="menu-button w-nav-button">
          <div data-is-ix2-target="1" class="lottie-animation" data-w-id="9dd3490a-de80-b703-3b15-6cc00388901f" data-animation-type="lottie" data-src="${navbarConfig.lottieMenu.src}" data-loop="0" data-direction="1" data-autoplay="0" data-renderer="svg" data-default-duration="2.0208333333333335" data-duration="0" data-ix2-initial-state="0"></div>
        </div>
      </div>
    </div>
  </div>`;
  }

  injectNavbar() {
    const navbarPlaceholder = document.querySelector('[data-component="navbar"]');
    if (navbarPlaceholder) navbarPlaceholder.outerHTML = this.renderNavbar();
    this.injectNavDropdownStyles();
    this.setupNavDropdowns();
  }

  updateNavigation() {
    const navItems = this.getNavConfig();
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navMenuEl = document.querySelector(".nav-menu");
    if (navMenuEl) {
      navMenuEl.innerHTML = this.renderNavLinks(navItems, currentPage);
      this.setupNavDropdowns();
    }
    document.querySelectorAll(".footer-link").forEach((link) => {
      if (link.getAttribute("href") === "sponsors.html" && link.textContent.trim() === "Sponsors") {
        link.textContent = "Past Sponsors";
      }
    });
  }
}

window.conferenceContent = new ConferenceContent();
document.addEventListener("DOMContentLoaded", () => {
  window.conferenceContent.injectNavbar();
  window.conferenceContent.updateNavigation();
  window.conferenceContent.renderAll();
});
