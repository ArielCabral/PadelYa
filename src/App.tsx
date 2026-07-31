import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, Users, Calendar, MapPin, Clock, Plus, Search, Filter, 
  MessageCircle, User, Sparkles, X, ThumbsUp, Flame, CircleDot, 
  Bot, Send, Loader2, Wand2, BrainCircuit, Share2, Bell, Download, Trash2
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [generoFiltro, setGeneroFiltro] = useState('Todos');
  const [modalAbierto, setModalAbierto] = useState(false);

  // Formulario para nuevo partido
  const [nuevoPartido, setNuevoPartido] = useState({
    categoria: '6°',
    fecha: 'Hoy',
    hora: '20:00',
    club: '',
    zona: '',
    faltan: 1,
    posicion: 'Indistinto',
    genero: 'Indistinto',
    telefono: ''
  });

  // Cargar partidos desde Supabase
  useEffect(() => {
    obtenerPartidos();

    const canal = supabase
      .channel('partidos_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'partidos' }, payload => {
        setPartidos(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'partidos' }, payload => {
        setPartidos(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const obtenerPartidos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPartidos(data);
    } catch (error) {
      console.error('Error al cargar partidos:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Dar de baja / Eliminar partido
  const handleDeleteMatch = async (id) => {
    const confirmDelete = window.confirm("¿Ya conseguiste compañero o deseas dar de baja esta búsqueda?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('partidos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPartidos(prev => prev.filter(p => p.id !== id));
      alert("La búsqueda ha sido dada de baja correctamente.");
    } catch (error) {
      alert("Error al eliminar la publicación: " + error.message);
      console.error(error);
    }
  };

  // Publicar partido
  const handleCrearPartido = async (e) => {
    e.preventDefault();
    if (!nuevoPartido.club || !nuevoPartido.telefono) {
      alert('Por favor completa el club y tu teléfono de WhatsApp.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('partidos')
        .insert([nuevoPartido])
        .select();

      if (error) throw error;

      setModalAbierto(false);
      setNuevoPartido({
        categoria: '6°',
        fecha: 'Hoy',
        hora: '20:00',
        club: '',
        zona: '',
        faltan: 1,
        posicion: 'Indistinto',
        genero: 'Indistinto',
        telefono: ''
      });
      alert('¡Partido publicado con éxito!');
      obtenerPartidos();
    } catch (error) {
      alert('Error al publicar el partido: ' + error.message);
    }
  };

  // Filtrar partidos
  const partidosFiltrados = useMemo(() => {
    return partidos.filter((p) => {
      const cumpleCategoria = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
      const cumpleGenero = generoFiltro === 'Todos' || p.genero === generoFiltro || !p.genero || p.genero === 'Indistinto';
      return cumpleCategoria && cumpleGenero;
    });
  }, [partidos, categoriaFiltro, generoFiltro]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Encabezado */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl font-bold flex items-center justify-center">
              🎾
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                PadelYa
              </h1>
              <p className="text-xs text-slate-400">Comunidad de Pádel</p>
            </div>
          </div>
          <button 
            onClick={() => setModalAbierto(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-sm shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Publicar
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Filtros */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['Todas', '3°', '4°', '5°', '6°', '7°', '8°'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  categoriaFiltro === cat 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                Cat. {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['Todos', 'Hombre', 'Mujer', 'Mixto'].map((gen) => (
              <button
                key={gen}
                onClick={() => setGeneroFiltro(gen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  generoFiltro === gen 
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {gen === 'Todos' ? '👫 Todos' : gen === 'Hombre' ? '🙋‍♂️ Hombre' : gen === 'Mujer' ? '🙋‍♀️ Mujer' : '🔀 Mixto'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de partidos */}
        <section className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p>Cargando partidos...</p>
            </div>
          ) : partidosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800/80 p-8">
              <p className="text-slate-400 font-medium">No hay partidos publicados con estos filtros.</p>
              <button 
                onClick={() => setModalAbierto(true)}
                className="mt-4 text-emerald-400 hover:underline text-sm font-semibold"
              >
                ¡Publica uno ahora!
              </button>
            </div>
          ) : (
            partidosFiltrados.map((partido) => (
              <div 
                key={partido.id} 
                className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-xl space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs px-3 py-1 rounded-full">
                      Cat. {partido.categoria}
                    </span>
                    <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {partido.genero === 'Hombre' ? '🙋‍♂️ Hombre' : partido.genero === 'Mujer' ? '🙋‍♀️ Mujer' : partido.genero === 'Mixto' ? '🔀 Mixto' : '👫 Indistinto'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {partido.fecha} - {partido.hora} hs
                    </span>

                    {/* Botón para Dar de Baja */}
                    <button
                      onClick={() => handleDeleteMatch(partido.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-1.5 rounded-lg transition-all text-xs flex items-center gap-1"
                      title="Dar de baja / Ya conseguí"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Dar de baja</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    {partido.club} <span className="text-slate-400 font-normal text-sm">({partido.zona})</span>
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Falta <span className="font-bold text-emerald-400">{partido.faltan}</span> jugador ({partido.posicion})
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center">
                  <a 
                    href={`https://wa.me/${partido.telefono}?text=Hola!%20Vi%20tu%20publicación%20en%20PadelYa%20para%20jugar%20en%20${encodeURIComponent(partido.club)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-md shadow-emerald-900/20"
                  >
                    <MessageCircle className="w-4 h-4" /> Sumarme por WhatsApp
                  </a>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Modal para publicar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 relative shadow-2xl">
            <button 
              onClick={() => setModalAbierto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-100">Publicar Partido</h2>
            
            <form onSubmit={handleCrearPartido} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Categoría</label>
                  <select 
                    value={nuevoPartido.categoria}
                    onChange={e => setNuevoPartido({...nuevoPartido, categoria: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    {['3°', '4°', '5°', '6°', '7°', '8°'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">¿Cuántos faltan?</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="3"
                    value={nuevoPartido.faltan}
                    onChange={e => setNuevoPartido({...nuevoPartido, faltan: parseInt(e.target.value)})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">¿Qué buscan?</label>
                  <select 
                    value={nuevoPartido.genero}
                    onChange={e => setNuevoPartido({...nuevoPartido, genero: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="Indistinto">Indistinto / Cualquiera</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Mixto">Mixto</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Lado / Posición</label>
                  <select 
                    value={nuevoPartido.posicion}
                    onChange={e => setNuevoPartido({...nuevoPartido, posicion: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="Indistinto">Indistinto</option>
                    <option value="Drive">Drive</option>
                    <option value="Revés">Revés</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Día</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Hoy / Mañana" 
                    value={nuevoPartido.fecha}
                    onChange={e => setNuevoPartido({...nuevoPartido, fecha: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Hora</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 20:30" 
                    value={nuevoPartido.hora}
                    onChange={e => setNuevoPartido({...nuevoPartido, hora: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Club / Nombre de la cancha</label>
                <input 
                  type="text" 
                  placeholder="Ej: Pádel Pro Central" 
                  value={nuevoPartido.club}
                  onChange={e => setNuevoPartido({...nuevoPartido, club: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Zona / Localidad</label>
                <input 
                  type="text" 
                  placeholder="Ej: Belgrano, CABA" 
                  value={nuevoPartido.zona}
                  onChange={e => setNuevoPartido({...nuevoPartido, zona: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tu WhatsApp (con código de país sin +)</label>
                <input 
                  type="text" 
                  placeholder="Ej: 5491122334455" 
                  value={nuevoPartido.telefono}
                  onChange={e => setNuevoPartido({...nuevoPartido, telefono: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl mt-2 transition-all"
              >
                Publicar Partido
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}