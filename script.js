let generatedPDF = null;

// Utility: convert File → Base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

// ---------------- JPG → PDF ----------------
document.getElementById("jpgConvertBtn").addEventListener("click", convertJPGtoPDF);

async function convertJPGtoPDF() {
  const { jsPDF } = window.jspdf;
  const input = document.getElementById('jpgInput').files;
  if (input.length === 0) return alert("Please select JPG image(s)");

  const orientationChoice = document.getElementById("orientation").value;
  let pdf;

  for (let i = 0; i < input.length; i++) {
    const imgData = await toBase64(input[i]);
    const img = new Image();
    img.src = imgData;

    await new Promise(res => {
      img.onload = () => {
        // auto detect or use dropdown value
        const orientation = orientationChoice === "auto"
          ? (img.width > img.height ? "l" : "p")
          : orientationChoice;

        if (i === 0) {
          pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });
        } else {
          pdf.addPage("a4", orientation);
        }

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (pageWidth - w) / 2;
        const y = (pageHeight - h) / 2;

        pdf.addImage(imgData, "JPEG", x, y, w, h);
        res();
      };
    });
  }

  generatedPDF = pdf.output("blob");
  const btn = document.getElementById("downloadPDF");
  btn.style.display = "inline-block";
  btn.onclick = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(generatedPDF);
    link.download = "converted.pdf";
    link.click();
  };
  alert("✅ PDF created! Click Download PDF.");
}

// ---------------- PDF → JPG ----------------
document.getElementById("pdfConvertBtn").addEventListener("click", convertPDFtoJPG);

async function convertPDFtoJPG() {
  const file = document.getElementById('pdfInput').files[0];
  if (!file) return alert("Please select a PDF");

  const preview = document.getElementById("pdfPreview");
  const downloads = document.getElementById("jpgDownloads");
  preview.innerHTML = "";
  downloads.innerHTML = "";

  const fileReader = new FileReader();
  fileReader.onload = async function() {
    const typedarray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedarray).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      const jpgData = canvas.toDataURL("image/jpeg");

      // Preview
      const img = document.createElement("img");
      img.src = jpgData;
      img.className = "thumb";
      preview.appendChild(img);

      // Download button
      const btn = document.createElement("button");
      btn.textContent = `⬇ Page ${i}`;
      btn.onclick = function() {
        const link = document.createElement('a');
        link.href = jpgData;
        link.download = `page_${i}.jpg`;
        link.click();
      };
      downloads.appendChild(btn);
    }
  };
  fileReader.readAsArrayBuffer(file);
}

// ---------------- Drag & Drop ----------------
function setupDrop(dropId, inputId) {
  const dropArea = document.getElementById(dropId);
  const input = document.getElementById(inputId);

  if (!dropArea || !input) return;

  dropArea.addEventListener("click", () => input.click());
  dropArea.addEventListener("dragover", e => {
    e.preventDefault();
    dropArea.classList.add("dragover");
  });
  dropArea.addEventListener("dragleave", () => dropArea.classList.remove("dragover"));
  dropArea.addEventListener("drop", e => {
    e.preventDefault();
    dropArea.classList.remove("dragover");
    input.files = e.dataTransfer.files;

    if (inputId === "jpgInput") showJPGPreview();
    else if (inputId === "pdfInput") document.getElementById("pdfPreview").innerHTML = "<p>PDF ready to convert ✔</p>";
  });

  input.addEventListener("change", () => {
    if (inputId === "jpgInput") showJPGPreview();
    else if (inputId === "pdfInput") document.getElementById("pdfPreview").innerHTML = "<p>PDF ready to convert ✔</p>";
  });
}

// JPG preview
async function showJPGPreview() {
  const files = document.getElementById("jpgInput").files;
  const preview = document.getElementById("jpgPreview");
  preview.innerHTML = "";
  for (let file of files) {
    const img = document.createElement("img");
    img.src = await toBase64(file);
    img.className = "thumb";
    preview.appendChild(img);
  }
}

// Init drag & drop
setupDrop("jpgDrop", "jpgInput");
setupDrop("pdfDrop", "pdfInput");
