/**
 * script.js
 * App Orchestrator with Institutional Logic.
 */
import { seedSystem } from './js/storage/seedData.js';
import { AuthManager } from './js/auth/AuthManager.js';
import { ScholarshipDB } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Data
    seedSystem();

    // 2. DOM Elements
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const dashboardSection = document.getElementById('dashboard-section');

    // Institutional Elements
    const heroSection = document.getElementById('hero-section');
    const mainContentSections = document.getElementById('site-content');
    const ctaSection = document.getElementById('cta-section');
    const benefitsSection = document.getElementById('benefits-section');
    const storiesSection = document.getElementById('stories-section');
    const portalContainer = document.getElementById('portal-container');
    const navPortal = document.getElementById('nav-portal');
    const navServices = document.getElementById('nav-services');
    const btnExplore = document.getElementById('btn-explore');

    const showPortal = () => {
        heroSection.classList.add('hidden');
        if (mainContentSections) mainContentSections.classList.add('hidden');
        if (ctaSection) ctaSection.classList.add('hidden');
        if (benefitsSection) benefitsSection.classList.add('hidden');
        if (storiesSection) storiesSection.classList.add('hidden');
        portalContainer.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const navPortalClick = (e) => { e.preventDefault(); showPortal(); };
    if (navPortal) navPortal.onclick = navPortalClick;
    if (navServices) navServices.onclick = navPortalClick;
    if (btnExplore) btnExplore.onclick = () => showPortal();

    // 3. App State & Navigation
    const updateUIState = () => {
        const user = AuthManager.getCurrentUser();

        if (user) {
            showPortal();
            loginSection.classList.add('hidden');
            registerSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');

            if (user.rol === 'Admin') {
                renderAdminDashboard(user);
            } else if (user.rol === 'Evaluador') {
                renderEvaluatorDashboard(user);
            } else {
                renderGenericDashboard(user);
            }
        } else {
            dashboardSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
            registerSection.classList.add('hidden');
        }
    };

    const renderAdminDashboard = (user) => {
        const calls = ScholarshipDB.getAll('calls');
        const applications = ScholarshipDB.getAll('applications');

        const totalPost = applications.length;
        const aprobadas = applications.filter(p => p.estado === 'Aprobada').length;
        const pctAprobadas = totalPost > 0 ? (aprobadas / totalPost) * 100 : 0;

        dashboardSection.innerHTML = `
            <header class="admin-actions">
                <div>
                    <h1>Panel de Administrador</h1>
                    <span class="user-badge badge-Admin">Admin: ${user.nombre}</span>
                </div>
                <button id="logout-btn" class="btn-cancel">Cerrar Sesión</button>
            </header>

            <section id="reports">
                <div class="reports-grid">
                    <div class="report-card">
                        <h4>Total Postulaciones</h4>
                        <p class="report-value">${totalPost}</p>
                    </div>
                    <div class="report-card">
                        <h4>Tasa de Aprobación</h4>
                        <p class="report-value">${aprobadas} aprobadas</p>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${pctAprobadas}%"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="management">
                <div class="admin-actions">
                    <h3>Convocatorias Vigentes</h3>
                    <button id="new-conv-btn" class="btn-gold">+ Crear Nueva</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Tipo</th>
                            <th>Cierre</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${calls.map(c => `
                            <tr>
                                <td>${c.titulo}</td>
                                <td>${c.tipo}</td>
                                <td>${c.fechaCierre}</td>
                                <td><strong>${c.estado}</strong></td>
                                <td>
                                    <button class="btn-small btn-edit" onclick="window.editConv(${c.id})">Editar</button>
                                    <button class="btn-small btn-delete" onclick="window.deleteConv(${c.id})">Borrar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        `;

        document.getElementById('logout-btn').onclick = () => { AuthManager.logout(); location.reload(); };
        document.getElementById('new-conv-btn').onclick = () => openModal();
    };

    const renderGenericDashboard = (user) => {
        const calls = ScholarshipDB.getAll('calls').filter(c => c.estado === 'Abierta');
        const applications = ScholarshipDB.getAll('applications').filter(p => p.usuarioId === user.id);

        dashboardSection.innerHTML = `
            <header class="admin-actions">
                <div>
                    <h1>Portal del Beneficiario</h1>
                    <span class="user-badge badge-Postulante">${user.nombre}</span>
                </div>
                <button id="logout-btn" class="btn-cancel">Cerrar Sesión</button>
            </header>

            <section id="my-applications">
                <h3>Mis Gestiones</h3>
                ${applications.length === 0 ? '<p>No has realizado solicitudes aún.</p>' : `
                    <table>
                        <thead>
                            <tr>
                                <th>Beca</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${applications.map(p => {
            const conv = ScholarshipDB.getById('calls', p.convocatoriaId);
            return `
                                    <tr>
                                        <td>${conv ? conv.titulo : 'N/A'}</td>
                                        <td>${p.fechaPostulacion}</td>
                                        <td><span class="status-badge status-${p.estado}">${p.estado}</span></td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                `}
            </section>

            <section id="available-scholarships">
                <h3>Servicios Disponibles</h3>
                <div class="cards-grid">
                    ${calls.length === 0 ? '<p>No hay servicios activos.</p>' : calls.map(c => `
                        <div class="scholarship-card">
                            <div>
                                <span class="type-tag">${c.tipo}</span>
                                <h3>${c.titulo}</h3>
                                <p class="description">${c.descripcion}</p>
                            </div>
                            <div class="footer">
                                <span>📅 Cierre: ${c.fechaCierre}</span>
                                <button class="btn-gold" onclick="window.applyToScholarship(${c.id})">Solicitar</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
        document.getElementById('logout-btn').onclick = () => { AuthManager.logout(); location.reload(); };
    };

    const renderEvaluatorDashboard = (user) => {
        const applications = ScholarshipDB.getAll('applications').filter(p => p.estado === 'Pendiente' || p.estado === 'Apta');

        dashboardSection.innerHTML = `
            <header class="admin-actions">
                <div>
                    <h1>Panel Técnico de Evaluación</h1>
                    <span class="user-badge badge-Evaluador">${user.nombre}</span>
                </div>
                <button id="logout-btn" class="btn-cancel">Cerrar Sesión</button>
            </header>

            <section>
                <h3>Casos por Resolver</h3>
                ${applications.length === 0 ? '<p>Bandeja vacía.</p>' : `
                    <table>
                        <thead>
                            <tr>
                                <th>Solicitante</th>
                                <th>Beca</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${applications.map(p => {
            const applicant = ScholarshipDB.getById('users', p.usuarioId);
            const conv = ScholarshipDB.getById('calls', p.convocatoriaId);
            return `
                                    <tr>
                                        <td>${applicant ? applicant.nombre : 'N/A'}</td>
                                        <td>${conv ? conv.titulo : 'N/A'}</td>
                                        <td><span class="status-badge status-${p.estado}">${p.estado}</span></td>
                                        <td><button class="btn-small btn-edit" onclick="window.openEvalModal(${p.id})">Calificar</button></td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                `}
            </section>
        `;
        document.getElementById('logout-btn').onclick = () => { AuthManager.logout(); location.reload(); };
    };

    // Modal helpers... (simplified for restoration)
    const openModal = (conv = null) => {
        document.getElementById('convocatoria-modal').classList.remove('hidden');
        if (conv) {
            document.getElementById('conv-id').value = conv.id;
            document.getElementById('conv-titulo').value = conv.titulo;
            document.getElementById('conv-tipo').value = conv.tipo;
            document.getElementById('conv-fecha').value = conv.fechaCierre;
            document.getElementById('conv-requisitos').value = conv.descripcion;
        }
    };

    window.applyToScholarship = (id) => {
        const user = AuthManager.getCurrentUser();
        const existing = ScholarshipDB.getAll('applications').find(p => p.usuarioId === user.id && p.convocatoriaId === id);
        if (existing) { alert("Ya posees una solicitud en curso."); return; }
        document.getElementById('post-conv-id').value = id;
        document.getElementById('postulacion-modal').classList.remove('hidden');
    };

    window.openEvalModal = (id) => {
        const post = ScholarshipDB.getById('applications', id);
        const user = ScholarshipDB.getById('users', post.usuarioId);
        document.getElementById('eval-post-id').value = id;
        document.getElementById('eval-applicant-name').textContent = user.nombre;
        document.getElementById('evaluacion-modal').classList.remove('hidden');
    };

    // Global listeners
    document.querySelectorAll('.btn-cancel, .btn-close').forEach(btn => {
        btn.onclick = () => document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    });

    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.onsubmit = (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const user = AuthManager.login(email, pass);
        if (user) updateUIState();
        else alert("Acceso denegado.");
    };

    updateUIState();
});
