const KEY = "focuspath-done";

function getDone() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY)) || []); } catch { return new Set(); }
}
function setDone(done) {
  try { localStorage.setItem(KEY, JSON.stringify([...done])); } catch { /* private mode: progress just isn't saved */ }
}
function countDone(videos, done) {
  return videos.filter((v) => done.has(v.id)).length;
}
function bar(n, total) {
  const pct = total ? Math.round((n / total) * 100) : 0;
  return `<div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>`;
}

// ---------- Home page ----------
function renderHome() {
  const done = getDone();
  const all = PATH.topics.flatMap((t) => t.videos);
  document.getElementById("path-title").textContent = PATH.title;
  document.getElementById("overall").innerHTML =
    `<p>${countDone(all, done)} of ${all.length} lessons done</p>${bar(countDone(all, done), all.length)}`;

  document.getElementById("topics").innerHTML = PATH.topics.map((t, i) => {
    const n = countDone(t.videos, done);
    return `<a class="card" href="topic.html?t=${t.id}">
      <span class="step">Step ${i + 1}</span>
      <span class="icon" aria-hidden="true">${t.icon}</span>
      <h3>${t.name}</h3>
      <p>${t.about}</p>
      <p class="muted">${n} of ${t.videos.length} lessons done</p>
      ${bar(n, t.videos.length)}
    </a>`;
  }).join("");
}

// ---------- Topic page ----------
function renderTopic() {
  const params = new URLSearchParams(location.search);
  const topic = PATH.topics.find((t) => t.id === params.get("t"));
  const main = document.getElementById("topic");
  if (!topic) {
    main.innerHTML = `<p>Topic not found. <a href="index.html">Go back to all topics</a></p>`;
    return;
  }
  document.title = `${topic.name} · FocusPath`;
  const done = getDone();
  // Start at the lesson in the link, else the first unfinished one.
  let current = Number(params.get("v"));
  if (!(current >= 0 && current < topic.videos.length)) {
    current = Math.max(0, topic.videos.findIndex((v) => !done.has(v.id)));
  }

  function draw() {
    const v = topic.videos[current];
    const n = countDone(topic.videos, done);
    const isDone = done.has(v.id);
    main.innerHTML = `
      <div class="topic-head">
        <h1>${topic.icon} ${topic.name}</h1>
        <p class="muted">${n} of ${topic.videos.length} lessons done</p>
        ${bar(n, topic.videos.length)}
      </div>
      <div class="layout">
        <section class="player">
          <div class="frame">
            <iframe src="https://www.youtube-nocookie.com/embed/${v.id}?rel=0"
              title="${v.title}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"></iframe>
          </div>
          <h2>Lesson ${current + 1}: ${v.title}</h2>
          <p class="muted">by ${v.by}</p>
          <div class="actions">
            <button id="toggle" class="${isDone ? "secondary" : "primary"}">${isDone ? "✓ Done (undo)" : "Mark as done"}</button>
            <button id="prev" class="secondary" ${current === 0 ? "disabled" : ""}>← Previous</button>
            <button id="next" class="secondary" ${current === topic.videos.length - 1 ? "disabled" : ""}>Next →</button>
          </div>
        </section>
        <aside class="lessons" aria-label="Lessons in ${topic.name}">
          <h3>Lessons, in order</h3>
          <ol>${topic.videos.map((x, i) => `
            <li><button class="lesson ${i === current ? "active" : ""}" data-i="${i}">
              <span class="tick" aria-hidden="true">${done.has(x.id) ? "✓" : i + 1}</span>
              <span>${x.title}<small>${x.by}</small></span>
              ${done.has(x.id) ? '<span class="sr-only">(done)</span>' : ""}
            </button></li>`).join("")}
          </ol>
        </aside>
      </div>`;

    document.getElementById("toggle").onclick = () => {
      isDone ? done.delete(v.id) : done.add(v.id);
      setDone(done);
      // Finishing a lesson moves you to the next one.
      if (!isDone && current < topic.videos.length - 1) current++;
      go();
    };
    document.getElementById("prev").onclick = () => { current--; go(); };
    document.getElementById("next").onclick = () => { current++; go(); };
    main.querySelectorAll(".lesson").forEach((b) => (b.onclick = () => { current = Number(b.dataset.i); go(); }));
  }
  function go() {
    history.replaceState(null, "", `?t=${topic.id}&v=${current}`);
    draw();
  }
  draw();
}
