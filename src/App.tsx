import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wrench, Users, Calendar, MapPin, Clock, Plus, Search, Filter, 
  MessageCircle, User, Sparkles, X, ThumbsUp, Flame, CircleDot, 
  Bot, Send, Loader2, Wand2, BrainCircuit, Share2, Bell, Smartphone, Trash2, ShieldCheck, ClipboardList
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [pestanaActiva, setPestanaActiva] = useState('profesionales'); // 'profesionales' o 'solicitudes'
  
  const [profesionales, setProfesionales] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [oficioFiltro, setOficioFiltro] = useState('Todos');
  const [zonaFiltro, setZonaFiltro] = useState('');
  
  const [modalProfesionalAbierto, setModalProfesionalAbierto] = useState(false);
  const [modalSolicitudAbierto, setModalSolicitudAbierto] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Formulario para registrarse como profesional
  const [nuevoProfesional, setNuevoProfesional] = useState({
    nombre: '',
    oficio: 'Electricista',
    matriculado: 'Sí',
    nro_matricula: '',
    zona: '',
    descripcion: '',
    telefono: ''
  });

  // Formulario para que el cliente publique una necesidad/demanda
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    cliente: '',
    oficio_requerido: 'Electricista',
    zona: '',
    descripcion: '',
    telefono: ''
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    obtenerDatos();

    // Canales en tiempo real para ambas tablas
    const canalProf = supabase
      .channel('profesionales_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profesionales' }, payload => {
        setProfesionales(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profesionales' }, payload => {
        setProfesionales(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .subscribe();

    const canalSol = supabase
      .channel('solicitudes_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'solicitudes' }, payload => {
        setSolicitudes(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'solicitudes' }, payload => {
        setSolicitudes(prev => prev.filter(s => s.id !== payload.old.id));
      })
      .subscribe();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      supabase.removeChannel(canalProf);
      supabase.removeChannel(canalSol);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      alert("Para instalar la app: Toca los tres puntos de la esquina superior derecha del navegador y selecciona 'Instalar aplicación'.");
    }
  };

  const obtenerDatos = async () => {
    try {
      setLoading(true);
      const [resProf, resSol] = await Promise.all([
        supabase.from('profesionales').select('*').order('created_at', { ascending: false }),
        supabase.from('solicitudes').select('*').order('created_at', { ascending: false })
      ]);

      if (resProf.data) setProfesionales(resProf.data);
      if (resSol.data) setSolicitudes(resSol.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (id) => {
    if (!window.confirm("¿Deseas dar de baja este perfil?")) return;
    const { error } = await supabase.from('profesionales').delete().eq('id', id);
    if (!error) setProfesionales(prev => prev.filter(p => p.id !== id));
  };

  const handleDeleteSolicitud = async (id) => {
    if (!window.confirm("¿Deseas dar de baja esta solicitud?")) return;
    const { error } = await supabase.from('solicitudes').delete().eq('id', id);
    if (!error) setSolicitudes(prev => prev.filter(s => s.id !== id));
  };

  const handleCrearPerfil = async (e) => {
    e.preventDefault();
    if (!nuevoProfesional.nombre || !nuevoProfesional.zona || !nuevoProfesional.telefono) {
      alert('Por favor completa nombre, zona y teléfono.');
      return;
    }

    const { error } = await supabase.from('profesionales').insert([nuevoProfesional]);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setModalProfesionalAbierto(false);
      setNuevoProfesional({ nombre: '', oficio: 'Electricista', matriculado: 'Sí', nro_matricula: '', zona: '', descripcion: '', telefono: '' });
      alert('¡Te registraste como profesional con éxito!');
    }
  };

  const handleCrearSolicitud = async (e) => {
    e.preventDefault();
    if (!nuevaSolicitud.cliente || !nuevaSolicitud.zona || !nuevaSolicitud.descripcion || !nuevaSolicitud.telefono) {
      alert('Por favor completa todos los campos de la solicitud.');
      return;
    }

    const { error } = await supabase.from('solicitudes').insert([nuevaSolicitud]);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setModalSolicitudAbierto(false);
      setNuevaSolicitud({ cliente: '', oficio_requerido: 'Electricista', zona: '', descripcion: '', telefono: '' });
      alert('¡Solicitud publicada con éxito!');
    }
  };

  const profesionalesFiltrados = useMemo(() => {
    return profesionales.filter((p) => {
      const cumpleOficio = oficioFiltro === 'Todos' || p.oficio === oficioFiltro;
      const cumpleZona = zonaFiltro === '' || p.zona.toLowerCase().includes(zonaFiltro.toLowerCase());
      return cumpleOficio && cumpleZona;
    });
  }, [profesionales, oficioFiltro, zonaFiltro]);

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const cumpleOficio = oficioFiltro === 'Todos' || s.oficio_requerido === oficioFiltro;
      const cumpleZona = zonaFiltro === '' || s.zona.toLowerCase().includes(zonaFiltro.toLowerCase());
      return cumpleOficio && cumpleZona;
    });
  }, [solicitudes, oficioFiltro, zonaFiltro]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Encabezado */}
      <header className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20 border border-amber-400/30">
              <Wrench className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 to-orange-200 bg-clip-text text-transparent">
                OficiosYa
              </h1>
              <p className="text-xs text-slate-400">Comunidad de Oficios Locales</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInstallClick}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold px-2.5 py-2 rounded-xl flex items-center gap-1.5 transition-all text-xs"
            >
              <Smartphone className="w-4 h-4" /> 
              <span className="hidden sm:inline">Instalar App</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Pestañas de navegación */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setPestanaActiva('profesionales')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              pestanaActiva === 'profesionales' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Buscar Profesionales
          </button>
          <button
            onClick={() => setPestanaActiva('solicitudes')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              pestanaActiva === 'solicitudes' 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Ver Demandas de Clientes
          </button>
        </div>

        {/* Botones de acción rápida según la pestaña */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="w-full sm:w-auto">
            <p className="text-xs text-slate-400 mb-1">¿Ofrecés un servicio?</p>
            <button 
              onClick={() => setModalProfesionalAbierto(true)}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-md"
            >
              <Plus className="w-4 h-4" /> Registrarme como Profesional
            </button>
          </div>
          <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
            <p className="text-xs text-slate-400 mb-1">¿Necesitás contratar a alguien?</p>
            <button 
              onClick={() => setModalSolicitudAbierto(true)}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Publicar lo que necesito
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['Todos', 'Electricista', 'Plomero / Gasista', 'Albañil', 'Carpintero', 'Pintor', 'Aire Acondicionado', 'Flete / Mudanza'].map((ofi) => (
              <button
                key={ofi}
                onClick={() => setOficioFiltro(ofi)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  oficioFiltro ===ofi 
                    ? 'bg-amber-500 text-slate-950' 
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {ofi}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text"
              placeholder="Filtrar por zona o localidad (Ej: Monte Grande, Ezeiza...)"
              value={zonaFiltro}
              onChange={(e) => setZonaFiltro(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* CONTENIDO DE LA PESTAÑA: PROFESIONALES */}
        {pestanaActiva === 'profesionales' && (
          <section className="space-y-4">
            <h2 className="text-md font-bold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" /> Profesionales Disponibles
            </h2>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p>Cargando profesionales...</p>
              </div>
            ) : profesionalesFiltrados.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800/80 p-8">
                <p className="text-slate-400 font-medium">No hay profesionales registrados con estos filtros.</p>
              </div>
            ) : (
              profesionalesFiltrados.map((prof) => (
                <div key={prof.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-xs px-3 py-1 rounded-full">
                        {prof.oficio}
                      </span>
                      {prof.matriculado === 'Sí' && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Matrícula: {prof.nro_matricula || 'Sí'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteProfile(prof.id)}
                      className="text-red-400 bg-red-500/10 hover:bg-red-500/20 p-1.5 rounded-lg text-xs flex items-center gap-1"
                      title="Eliminar perfil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-400" /> {prof.nombre}
                    </h3>
                    <p className="text-sm text-slate-300 mt-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-500" /> Zona: <span className="font-semibold">{prof.zona}</span>
                    </p>
                    {prof.descripcion && (
                      <p className="text-xs text-slate-400 mt-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                        "{prof.descripcion}"
                      </p>
                    )}
                  </div>

                  <a 
                    href={`https://wa.me/${prof.telefono}?text=Hola%20${encodeURIComponent(prof.nombre)}!%20Te%20contacto%20desde%20OficiosYa.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
                  </a>
                </div>
              ))
            )}
          </section>
        )}

        {/* CONTENIDO DE LA PESTAÑA: SOLICITUDES DE CLIENTES */}
        {pestanaActiva === 'solicitudes' && (
          <section className="space-y-4">
            <h2 className="text-md font-bold text-slate-300 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-400" /> Clientes que necesitan un oficio
            </h2>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p>Cargando solicitudes...</p>
              </div>
            ) : solicitudesFiltradas.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800/80 p-8">
                <p className="text-slate-400 font-medium">No hay demandas publicadas con estos filtros.</p>
                <button 
                  onClick={() => setModalSolicitudAbierto(true)}
                  className="mt-3 text-amber-400 hover:underline text-sm font-semibold"
                >
                  ¡Publica tu necesidad ahora!
                </button>
              </div>
            ) : (
              solicitudesFiltradas.map((sol) => (
                <div key={sol.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold text-xs px-3 py-1 rounded-full">
                      Busca: {sol.oficio_requerido}
                    </span>
                    <button
                      onClick={() => handleDeleteSolicitud(sol.id)}
                      className="text-red-400 bg-red-500/10 hover:bg-red-500/20 p-1.5 rounded-lg text-xs"
                      title="Eliminar solicitud"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                      <User className="w-4 h-4 text-orange-400" /> {sol.cliente}
                    </h3>
                    <p className="text-sm text-slate-300 mt-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-500" /> Zona: <span className="font-semibold">{sol.zona}</span>
                    </p>
                    <p className="text-xs text-slate-300 mt-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
                      <strong>Detalle:</strong> "{sol.descripcion}"
                    </p>
                  </div>

                  <a 
                    href={`https://wa.me/${sol.telefono}?text=Hola%20${encodeURIComponent(sol.cliente)}!%20Vi%20tu%20pedido%20en%20OficiosYa%20y%20soy%20profesional.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" /> Ofrecer mis servicios (WhatsApp)
                  </a>
                </div>
              ))
            )}
          </section>
        )}
      </main>

      {/* MODAL: REGISTRARSE COMO PROFESIONAL */}
      {modalProfesionalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModalProfesionalAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-100">Registrarme como Profesional</h2>
            
            <form onSubmit={handleCrearPerfil} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre y Apellido</label>
                <input 
                  type="text" placeholder="Ej: Carlos Gómez" 
                  value={nuevoProfesional.nombre}
                  onChange={e => setNuevoProfesional({...nuevoProfesional, nombre: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Oficio</label>
                  <select 
                    value={nuevoProfesional.oficio}
                    onChange={e => setNuevoProfesional({...nuevoProfesional, oficio: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="Electricista">Electricista</option>
                    <option value="Plomero / Gasista">Plomero / Gasista</option>
                    <option value="Albañil">Albañil</option>
                    <option value="Carpintero">Carpintero</option>
                    <option value="Pintor">Pintor</option>
                    <option value="Aire Acondicionado">Aire Acondicionado</option>
                    <option value="Flete / Mudanza">Flete / Mudanza</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">¿Matriculado?</label>
                  <select 
                    value={nuevoProfesional.matriculado}
                    onChange={e => setNuevoProfesional({...nuevoProfesional, matriculado: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="Sí">Sí</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {nuevoProfesional.matriculado === 'Sí' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">N° de Matrícula</label>
                  <input 
                    type="text" placeholder="Ej: MAT-44219" 
                    value={nuevoProfesional.nro_matricula}
                    onChange={e => setNuevoProfesional({...nuevoProfesional, nro_matricula: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Zona de cobertura / Localidad</label>
                <input 
                  type="text" placeholder="Ej: Monte Grande, Canning" 
                  value={nuevoProfesional.zona}
                  onChange={e => setNuevoProfesional({...nuevoProfesional, zona: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Descripción de tus servicios</label>
                <textarea 
                  placeholder="Ej: Urgencias 24hs, instalaciones..." 
                  value={nuevoProfesional.descripcion}
                  onChange={e => setNuevoProfesional({...nuevoProfesional, descripcion: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white h-20 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">WhatsApp (con código de país sin +)</label>
                <input 
                  type="text" placeholder="Ej: 5491122334455" 
                  value={nuevoProfesional.telefono}
                  onChange={e => setNuevoProfesional({...nuevoProfesional, telefono: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl mt-2 transition-all">
                Guardar Mi Perfil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PUBLICAR NECESIDAD / SOLICITUD */}
      {modalSolicitudAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModalSolicitudAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-100">Publicar lo que Necesito</h2>
            
            <form onSubmit={handleCrearSolicitud} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tu Nombre</label>
                <input 
                  type="text" placeholder="Ej: María Pérez" 
                  value={nuevaSolicitud.cliente}
                  onChange={e => setNuevaSolicitud({...nuevaSolicitud, cliente: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">¿Qué oficio necesitás?</label>
                <select 
                  value={nuevaSolicitud.oficio_requerido}
                  onChange={e => setNuevaSolicitud({...nuevaSolicitud, oficio_requerido: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="Electricista">Electricista</option>
                  <option value="Plomero / Gasista">Plomero / Gasista</option>
                  <option value="Albañil">Albañil</option>
                  <option value="Carpintero">Carpintero</option>
                  <option value="Pintor">Pintor</option>
                  <option value="Aire Acondicionado">Aire Acondicionado</option>
                  <option value="Flete / Mudanza">Flete / Mudanza</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Zona / Localidad</label>
                <input 
                  type="text" placeholder="Ej: Monte Grande" 
                  value={nuevaSolicitud.zona}
                  onChange={e => setNuevaSolicitud({...nuevaSolicitud, zona: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">¿Qué trabajo necesitás que hagan?</label>
                <textarea 
                  placeholder="Ej: Se saltó la térmica de la casa y necesito revisar el tablero..." 
                  value={nuevaSolicitud.descripcion}
                  onChange={e => setNuevaSolicitud({...nuevaSolicitud, descripcion: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white h-20 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tu WhatsApp de contacto</label>
                <input 
                  type="text" placeholder="Ej: 5491122334455" 
                  value={nuevaSolicitud.telefono}
                  onChange={e => setNuevaSolicitud({...nuevaSolicitud, telefono: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl mt-2 transition-all">
                Publicar Solicitud
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}