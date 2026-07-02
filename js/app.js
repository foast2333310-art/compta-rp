function openCompta() {
  document.getElementById('comptaModal').classList.add('active');
  document.getElementById('comptaStepCode').style.display = 'block';
  document.getElementById('comptaStepResult').style.display = 'none';
  document.getElementById('comptaCodeError').classList.remove('visible');
  document.getElementById('illegalWarning').classList.remove('visible');
  document.getElementById('comptaCodeInput').value = '';
  setTimeout(function() { document.getElementById('comptaCodeInput').focus(); }, 100);
}

function closeCompta() {
  document.getElementById('comptaModal').classList.remove('active');
  document.getElementById('comptaCodeError').classList.remove('visible');
  document.getElementById('illegalWarning').classList.remove('visible');
}

function comptaBack() {
  document.getElementById('comptaStepCode').style.display = 'block';
  document.getElementById('comptaStepResult').style.display = 'none';
  document.getElementById('comptaCodeError').classList.remove('visible');
  document.getElementById('illegalWarning').classList.remove('visible');
  document.getElementById('comptaCodeInput').value = '';
  setTimeout(function() { document.getElementById('comptaCodeInput').focus(); }, 100);
}

function checkComptaCode() {
  var code = document.getElementById('comptaCodeInput').value.trim().toUpperCase();
  var error = document.getElementById('comptaCodeError');
  error.classList.remove('visible');

  if (code === COMPTA.codes.legal) {
    renderCompta('legal');
    document.getElementById('comptaStepCode').style.display = 'none';
    document.getElementById('comptaStepResult').style.display = 'block';
  } else if (code === COMPTA.codes.illegal) {
    renderCompta('illegal');
    document.getElementById('illegalWarning').classList.add('visible');
    document.getElementById('comptaStepCode').style.display = 'none';
    document.getElementById('comptaStepResult').style.display = 'block';
  } else {
    error.classList.add('visible');
    document.getElementById('comptaCodeInput').value = '';
  }
}

function renderCompta(type) {
  var data = COMPTA[type];
  document.getElementById('comptaTitle').textContent = data.titre;
  document.getElementById('comptaSubtitle').textContent = data.soustitre;

  var totalRecettes = 0;
  var totalDepenses = 0;
  var rows = '';

  data.entrees.forEach(function(entry) {
    totalRecettes += entry.recette;
    totalDepenses += entry.depense;
    var dateF = entry.date.split('-').reverse().join('/');
    rows += '<tr>' +
      '<td>' + dateF + '</td>' +
      '<td>' + entry.description + '</td>' +
      '<td>' + entry.categorie + '</td>' +
      '<td class="amount positive">' + (entry.recette > 0 ? formatMoney(entry.recette) : '-') + '</td>' +
      '<td class="amount negative">' + (entry.depense > 0 ? formatMoney(entry.depense) : '-') + '</td>' +
      '</tr>';
  });

  document.getElementById('comptaBody').innerHTML = rows;
  document.getElementById('totalRecettes').textContent = formatMoney(totalRecettes);
  document.getElementById('totalDepenses').textContent = formatMoney(totalDepenses);
  document.getElementById('totalSolde').textContent = formatMoney(totalRecettes - totalDepenses);
}

function formatMoney(amount) {
  return amount.toLocaleString('fr-FR') + ' $';
}

document.addEventListener('DOMContentLoaded', function() {
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
      this.reset();
    });
  }

  document.getElementById('comptaModal').addEventListener('click', function(e) {
    if (e.target === this) closeCompta();
  });

  document.getElementById('comptaCodeInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') checkComptaCode();
  });

  var clicks = 0;
  var brand = document.getElementById('brandTrigger');
  if (brand) {
    brand.addEventListener('click', function() {
      clicks++;
      if (clicks >= 3) {
        clicks = 0;
        openCompta();
      }
      clearTimeout(brand._timer);
      brand._timer = setTimeout(function() { clicks = 0; }, 800);
    });
    brand.style.cursor = 'pointer';
  }
});
