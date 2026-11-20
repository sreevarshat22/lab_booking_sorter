const rowsElement = document.querySelector("#request-rows");
let requests = [];
const labNames = { LAB1: "Python Lab 1", LAB3: "AI Lab", LAB5: "Seminar Hall" };
const statusNames = {
  available: "Available · tentative",
  needs_more_info: "Needs details",
  lab_closed: "Lab closed",
  over_capacity: "Over capacity",
  conflict: "Schedule conflict",
};

function render() {
  const filter = document.querySelector("#status-filter").value;
  const shown = requests.filter((item) => {
    if (filter === "available") return item.status === "available";
    if (filter === "issues") return item.status !== "available";
    return true;
  });
  document.querySelector("#stat-total").textContent = requests.length;
  document.querySelector("#stat-available").textContent = requests.filter((item) => item.status === "available").length;
  document.querySelector("#stat-attention").textContent = requests.filter((item) => item.status !== "available").length;
  document.querySelector("#row-count").textContent = `Showing ${shown.length} of ${requests.length} requests`;
  rowsElement.replaceChildren();

  if (!shown.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-state";
    cell.textContent = "No requests match this filter.";
    row.append(cell);
    rowsElement.append(row);
    return;
  }

  for (const item of shown) {
    const row = document.createElement("tr");
    const request = document.createElement("td");
    request.className = "request-cell";
    request.textContent = item.request;
    request.title = item.request;

    const lab = document.createElement("td");
    const tag = document.createElement("span");
    tag.className = "lab-tag";
    tag.textContent = labNames[item.lab] || "Unspecified";
    lab.append(tag);

    const dateCell = document.createElement("td");
    dateCell.className = "date-cell";
    dateCell.textContent = item.date ? new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
    const slot = document.createElement("small");
    slot.textContent = item.slot === "FN" ? "Morning" : item.slot === "AN" ? "Afternoon" : "Time not specified";
    dateCell.append(slot);

    const students = document.createElement("td");
    students.textContent = item.students ?? "—";

    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `status status-${item.status}`;
    badge.textContent = statusNames[item.status] || item.status;
    badge.title = item.reason;
    statusCell.append(badge);

    row.append(request, lab, dateCell, students, statusCell);
    rowsElement.append(row);
  }
}

async function loadDemo() {
  const button = document.querySelector("#load-demo");
  button.disabled = true;
  button.textContent = "Loading…";
  try {
    const response = await fetch("/api/demo");
    if (!response.ok) throw new Error("Could not load sample requests.");
    const data = await response.json();
    requests = data.results;
    render();
  } catch (error) {
    window.alert(error.message);
  } finally {
    button.disabled = false;
    button.innerHTML = "<span>↻</span> Load sample requests";
  }
}

document.querySelector("#load-demo").addEventListener("click", loadDemo);
document.querySelector("#status-filter").addEventListener("change", render);

document.querySelector("#booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector("#form-message");
  const submit = form.querySelector('button[type="submit"]');
  const fields = new FormData(form);
  const payload = {
    request: fields.get("request"),
    lab: fields.get("lab"),
    date: fields.get("date"),
    slot: fields.get("slot"),
    students: Number(fields.get("students")),
  };
  message.textContent = "";
  submit.disabled = true;
  submit.textContent = "Checking…";
  try {
    const response = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not check this request.");
    requests.unshift(data.result);
    render();
    form.reset();
    message.style.color = "#578551";
    message.textContent = statusNames[data.result.status] + ". " + data.result.reason;
  } catch (error) {
    message.style.color = "#af6835";
    message.textContent = error.message;
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Check availability <span>→</span>';
  }
});

loadDemo();
