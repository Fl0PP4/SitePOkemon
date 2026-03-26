let allLoadedPokemons = [];
let offset = 0;
const limit = 30;
let isLoading = false;
let hasMore = true;

const container      = document.getElementById("pokemon-container");
const searchInput    = document.getElementById("pokemon-search");
const typeFilter     = document.getElementById("type-filter");
const loadMoreBtn    = document.getElementById("load-more-btn");

// Carrega lista de tipos
async function carregarListaDeTipos() {
  try {
    const res = await fetch("https://pokeapi.co/api/v2/type");
    if (!res.ok) throw new Error("Erro ao carregar tipos");
    const data = await res.json();

    const tipos = data.results
      .map(t => t.name)
      .filter(name => name !== "unknown" && name !== "stellar");

    tipos.forEach(typeName => {
      const opt = document.createElement("option");
      opt.value = typeName;
      opt.textContent = typeName.charAt(0).toUpperCase() + typeName.slice(1);
      typeFilter.appendChild(opt);
    });
  } catch (err) {
    console.error("Falha ao carregar tipos:", err);
  }
}

// Carrega pokémons
async function carregarPokemons() {
  if (isLoading || !hasMore) return;

  isLoading = true;
  loadMoreBtn.disabled = true;
  loadMoreBtn.textContent = "Carregando...";

  try {
    const url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Falha na API");

    const data = await res.json();

    if (!data.next || data.results.length === 0) {
      hasMore = false;
      loadMoreBtn.style.display = "none";
    }

    const promises = data.results.map(p => fetch(p.url).then(r => r.json()));
    const novosPokemons = await Promise.all(promises);

    allLoadedPokemons.push(...novosPokemons);
    offset += limit;

    renderizarPokemons();
  } catch (err) {
    console.error(err);
  } finally {
    isLoading = false;
    if (hasMore) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Carregar mais 30 Pokémon";
    }
  }
}

// Renderiza cards com filtros
function renderizarPokemons() {
  const termo = searchInput.value.toLowerCase().trim();
  const tipoSelecionado = typeFilter.value;

  let pokemonsParaMostrar = allLoadedPokemons;

  if (termo.length >= 2) {
    pokemonsParaMostrar = pokemonsParaMostrar.filter(p =>
      p.name.toLowerCase().includes(termo)
    );
  }

  if (tipoSelecionado) {
    pokemonsParaMostrar = pokemonsParaMostrar.filter(p =>
      p.types.some(t => t.type.name === tipoSelecionado)
    );
  }

  if (pokemonsParaMostrar.length === 0) {
    container.innerHTML = `<p class="no-results">Nenhum Pokémon encontrado${
      termo || tipoSelecionado ? " com os filtros aplicados" : ""
    }.</p>`;
    return;
  }

  container.innerHTML = pokemonsParaMostrar.map(p => `
    <div class="card">
      <img src="${p.sprites.front_default || 'https://placehold.co/220?text=?'}"
           alt="${p.name}" loading="lazy">
      <div class="card-content">
        <div class="number">#${p.id.toString().padStart(3, '0')}</div>
        <h3>${p.name}</h3>
        <div class="types">
          ${p.types.map(t => `
            <span class="type ${t.type.name}">${t.type.name}</span>
          `).join('')}
        </div>
      </div>
    </div>
  `).join("");
}

// Eventos
searchInput.addEventListener("input", renderizarPokemons);
typeFilter.addEventListener("change", renderizarPokemons);
loadMoreBtn.addEventListener("click", carregarPokemons);


carregarListaDeTipos();
carregarPokemons();