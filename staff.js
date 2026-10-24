/* mobile menu */
(function () {
  var toggle = document.getElementById('navToggle');
  var links = document.querySelector('.nav-links');
  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

(function () {
  var ACCESS_CODE = "7&jO*L#c";

  var gate = document.getElementById("gate");
  var panel = document.getElementById("panel");
  var form = document.getElementById("gateForm");
  var input = document.getElementById("gateCode");
  var error = document.getElementById("gateError");
  var gateCard = document.getElementById("gateCard");

  function showPanel() {
    gate.style.display = "none";
    panel.style.display = "block";
    document.title = "Staff Hub | Fun Border Roleplay";
  }

  /* unlocks survive refresh (sessionStorage) — cleared only when the tab/browser closes
     or via the Lock button */
  if (sessionStorage.getItem("fbrp_staff_unlocked") === "1") {
    showPanel();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (input.value === ACCESS_CODE) {
      sessionStorage.setItem("fbrp_staff_unlocked", "1");
      showPanel();
    } else {
      error.textContent = "Incorrect code. Please try again.";
      input.value = "";
      gateCard.classList.remove("shake");
      void gateCard.offsetWidth; /* restart animation */
      gateCard.classList.add("shake");
    }
  });

  document.getElementById("lockout").addEventListener("click", function () {
    sessionStorage.removeItem("fbrp_staff_unlocked");
    sessionStorage.removeItem("fbrp_training_unlocked");
    location.reload();
  });

  /* tabs */
  var tabs = document.querySelectorAll(".tab");
  var trainUnlocked = sessionStorage.getItem("fbrp_training_unlocked") === "1";
  if (trainUnlocked) {
    var trIcon = document.getElementById("trainLockIcon");
    if (trIcon) { trIcon.style.display = "none"; }
  }
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");
      if (target === "training" && !trainUnlocked) {
        openTrainModal(tab);
        return;
      }
      activateTab(tab);
    });
  });

  function activateTab(tab) {
    tabs.forEach(function (t) { t.classList.remove("active"); });
    document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
    tab.classList.add("active");
    document.getElementById(tab.getAttribute("data-tab")).classList.add("active");
  }

  /* training guide gate */
  var TRAIN_CODE = "h&5l*c^3";
  var trainModal = document.getElementById("trainModal");
  var trainForm = document.getElementById("trainForm");
  var trainInput = document.getElementById("trainCode");
  var trainError = document.getElementById("trainError");
  var trainCard = document.getElementById("trainCard");
  var pendingTab = null;

  function openTrainModal(tab) {
    pendingTab = tab;
    trainModal.style.display = "flex";
    trainError.textContent = "";
    trainInput.value = "";
    setTimeout(function () { trainInput.focus(); }, 50);
  }

  function closeTrainModal() {
    trainModal.style.display = "none";
    pendingTab = null;
  }

  trainForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (trainInput.value === TRAIN_CODE) {
      trainUnlocked = true;
      sessionStorage.setItem("fbrp_training_unlocked", "1");
      var icon = document.getElementById("trainLockIcon");
      if (icon) { icon.style.display = "none"; }
      closeTrainModal();
      if (pendingTab) { activateTab(pendingTab); }
    } else {
      trainError.textContent = "Incorrect code. Please try again.";
      trainInput.value = "";
      trainCard.classList.remove("shake");
      void trainCard.offsetWidth;
      trainCard.classList.add("shake");
    }
  });

  document.getElementById("trainCancel").addEventListener("click", function (e) {
    e.preventDefault();
    closeTrainModal();
  });

  trainModal.addEventListener("click", function (e) {
    if (e.target === trainModal) { closeTrainModal(); }
  });

  /* copy buttons on :m / :h chat lines */
  document.querySelectorAll(".chat-line").forEach(function (line) {
    var text = line.textContent.trim();
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-line";
    btn.title = "Copy to clipboard";
    btn.setAttribute("aria-label", "Copy to clipboard");
    btn.textContent = "\u29C9";

    function fallbackCopy() {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }

    btn.addEventListener("click", function () {
      var done = function () {
        btn.textContent = "\u2713";
        setTimeout(function () { btn.textContent = "\u29C9"; }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(); done(); });
      } else {
        fallbackCopy();
        done();
      }
    });
    line.appendChild(btn);
  });

  /* keyboard shortcuts: 1-4 switch tabs */
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    var i = ["1", "2", "3", "4"].indexOf(e.key);
    if (i === -1 || !tabs[i]) return;
    tabs[i].click();
  });

})();
