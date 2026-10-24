(function () {
  const BASE = "";
  let currentJobId = null;
  let clips = [];
  let selectedClipIndex = null;

  const el = (id) => document.getElementById(id);

  // ---------- API helpers ----------
  async function api(path, opts = {}) {
    const res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json", ...opts.headers },
      ...opts,
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }

  async function loadClips(jobId) {
    currentJobId = jobId;
    const data = await api(`/clips/${jobId}/clips`);
    clips = data.clips || [];
    renderClipList();
    renderTimeline();
    if (clips.length) selectClip(0);
    el("viralityBadge").textContent = `Score: --`;
  }

  // ---------- Clip list ----------
  function renderClipList() {
    const list = el("clipList");
    list.innerHTML = "";
    if (!clips.length) {
      list.innerHTML = '<div class="empty">No clips. Generate via POST /clips</div>';
      return;
    }
    clips.forEach((c) => {
      const card = document.createElement("div");
      card.className = `clip-card ${selectedClipIndex === c.index ? "selected" : ""}`;
      card.innerHTML = `
        <div class="clip-meta">
          <div class="clip-title">Clip ${c.index}</div>
          <div class="clip-sub">${c.start.toFixed(1)}s → ${c.end.toFixed(1)}s · ${c.duration.toFixed(1)}s</div>
        </div>
        <div class="clip-score">${c.score}</div>
      `;
      card.onclick = () => selectClip(c.index);
      list.appendChild(card);
    });
  }

  function selectClip(index) {
    selectedClipIndex = index;
    const c = clips.find((x) => x.index === index);
    if (!c) return;
    renderClipList();
    el("propTarget").textContent = `Clip ${c.index}`;
    el("propStart").value = c.start;
    el("propEnd").value = c.end;
    el("propDuration").value = c.duration;
    el("propScore").textContent = c.score;
    el("propTier").textContent = c.tier;
    el("propPlatform").textContent = c.recommended_platform || "—";
    el("propRationale").textContent = c.rationale || "—";
    el("propScore").className = `score-chip ${c.tier === "Viral" ? "badge-good" : ""}`;
    renderTimeline();
    loadPreview(c.output_path);
  }

  // ---------- Timeline ----------
  function renderTimeline() {
    const lane = el("laneVideo");
    lane.innerHTML = "";
    if (!clips.length) return;
    const scale = 12; // px per second
    clips.forEach((c) => {
      const item = document.createElement("div");
      item.className = `clip-item ${selectedClipIndex === c.index ? "selected" : ""}`;
      item.style.left = (c.start * scale) + "px";
      item.style.width = Math.max(c.duration * scale, 60) + "px";
      item.title = `Clip ${c.index} · ${c.duration.toFixed(1)}s · score ${c.score}`;
      item.textContent = `Clip ${c.index}`;
      lane.appendChild(item);
    });
    // subtitles lane placeholder
    const slane = el("laneSubtitles");
    slane.innerHTML = clips.map((c, i) => `
      <div class="clip-item" style="left:${c.start*12}px;width:${Math.max(c.duration*12,60)}px;opacity:0.7;background:#64748b;" title="Sub ${i+1}">Sub</div>
    `).join("");
  }

  // ---------- Preview ----------
  function loadPreview(src) {
    const v = el("previewVideo");
    v.src = BASE + "/clips/" + currentJobId + "/download/1";
    // For simplicity preview first clip; real app maps index->file
    v.load();
  }

  el("btnPlayPause").onclick = () => {
    const v = el("previewVideo");
    if (v.paused) v.play(); else v.pause();
    el("btnPlayPause").textContent = v.paused ? "▶" : "⏸";
  };
  el("previewVideo").onclick = () => {
    el("previewVideo").paused ? el("previewVideo").play() : el("previewVideo").pause();
    el("btnPlayPause").textContent = el("previewVideo").paused ? "▶" : "⏸";
  };
  el("previewVideo").ontimeupdate = () => {
    const v = el("previewVideo");
    const pct = (v.currentTime / v.duration) * 100 || 0;
    el("previewScrub").value = pct;
    el("playhead").style.left = pct + "%";
    el("previewVideo").parentElement.querySelector(".time").textContent =
      fmt(v.currentTime) + " / " + fmt(v.duration);
  };

  function fmt(t) {
    if (!t) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  // ---------- Properties ----------
  el("propStart").onchange = () => updateProp("start");
  el("propEnd").onchange = () => updateProp("end");
  function updateProp(field) {
    if (selectedClipIndex === null) return;
    const c = clips.find((x) => x.index === selectedClipIndex);
    c[field] = parseFloat(el("prop" + field[0].toUpperCase() + field.slice(1)).value) || c[field];
    if (field === "start") c.start = parseFloat(el("propStart").value) || c.start;
    if (field === "end") c.end = parseFloat(el("propEnd").value) || c.end;
    c.duration = c.end - c.start;
    el("propDuration").value = c.duration;
    renderTimeline();
  }

  // ---------- Typography ----------
  el("btnApplyStyle").onclick = () => {
    const style = {
      font: el("fontFamily").value,
      size: el("fontSize").value,
      color: el("fontColor").value,
      in: el("animIn").value,
      out: el("animOut").value,
      loop: el("animLoop").value,
    };
    alert("Style applied (preview):\n" + JSON.stringify(style, null, 2));
  };

  // ---------- AI Titles ----------
  el("btnGenTitle").onclick = async () => {
    if (selectedClipIndex === null) return alert("Select a clip first");
    const c = clips.find((x) => x.index === selectedClipIndex);
    const platform = el("titlePlatform").value;
    const titles = await api("/clips/" + currentJobId + "/ai-title", {
      method: "POST",
      body: JSON.stringify({ clip_index: c.index, platform }),
    });
    el("titleResult").innerHTML = "<strong>" + (titles.title || "—") + "</strong><br><small>" + (titles.hashtags || "") + "</small>";
  };

  // ---------- Export ----------
  el("btnExport").onclick = () => {
    if (!currentJobId) return alert("No project loaded");
    alert("Export queued for job " + currentJobId + "\n(Use /clips/{job}/download/{index} to fetch MP4s)");
  };

  el("btnRefresh").onclick = () => {
    if (currentJobId) loadClips(currentJobId);
  };

  // ---------- Bootstrap ----------
  // Try to load an existing job from query param ?job=...
  const params = new URLSearchParams(location.search);
  if (params.get("job")) {
    loadClips(params.get("job"));
  }
})();
