document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://gauchito-gil-api.onrender.com/api'; // *** IMPORTANTE: Cambiar a la URL de Render cuando esté desplegado ***

    const loginSection = document.getElementById('loginSection');
    const adminSection = document.getElementById('adminSection');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminEmailInput = document.getElementById('adminEmail');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');
    const adminPostsTableBody = document.getElementById('adminPostsTableBody');
    const logoutBtn = document.getElementById('logoutBtn');

    // Modal de edición
    const editPostModal = document.getElementById('editPostModal');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    const editPostForm = document.getElementById('editPostForm');
    const editPostIdInput = document.getElementById('editPostId');
    const editNameInput = document.getElementById('editName');
    const editTypeSelect = document.getElementById('editType');
    const editMessageTextarea = document.getElementById('editMessage');
    const editCommentsList = document.getElementById('editCommentsList');
    const noCommentsMessage = document.getElementById('noCommentsMessage');

    const adminToast = document.getElementById('adminToast');

    let adminToken = localStorage.getItem('adminToken'); // Obtener token del localStorage

    // --- Funciones de Utilidad ---
    const showAdminToast = (message, isError = false) => {
        adminToast.textContent = message;
        adminToast.classList.remove('hidden', 'bg-green-500', 'bg-red-500');
        adminToast.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
        setTimeout(() => {
            adminToast.classList.add('hidden');
        }, 3000);
    };

    const toggleAdminViews = () => {
        if (adminToken) {
            loginSection.classList.add('hidden');
            adminSection.classList.remove('hidden');
            fetchAdminPosts(); // Cargar posts si ya hay token
        } else {
            loginSection.classList.remove('hidden');
            adminSection.classList.add('hidden');
            adminLoginForm.reset();
            loginError.textContent = '';
        }
    };

    const getAuthHeaders = () => {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        };
    };

    // --- Funciones de Login/Logout ---
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = adminEmailInput.value;
        const password = adminPasswordInput.value;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                adminToken = data.token;
                localStorage.setItem('adminToken', adminToken);
                toggleAdminViews();
                showAdminToast('¡Inicio de sesión exitoso!');
            } else {
                loginError.textContent = data.message || 'Error al iniciar sesión.';
                loginError.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error de red al intentar iniciar sesión:', error);
            loginError.textContent = 'Error de conexión. Inténtalo de nuevo.';
            loginError.classList.remove('hidden');
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        adminToken = null;
        toggleAdminViews();
        showAdminToast('Sesión cerrada.');
    });

    // --- Funciones de Gestión de Posts ---

    const fetchAdminPosts = async () => {
        if (!adminToken) {
            toggleAdminViews(); // Asegurarse de volver a la vista de login si no hay token
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/posts`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                // Si el token expira o es inválido, forzar logout
                if (response.status === 401) {
                    localStorage.removeItem('adminToken');
                    adminToken = null;
                    toggleAdminViews();
                    showAdminToast('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', true);
                }
                throw new Error('No se pudieron cargar los posts para el admin.');
            }

            const posts = await response.json();
            renderAdminPosts(posts);
        } catch (error) {
            console.error('Error al cargar posts para admin:', error);
            showAdminToast(`Error: ${error.message}`, true);
            adminPostsTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-red-400">Error al cargar posts.</td></tr>`;
        }
    };

    const renderAdminPosts = (posts) => {
        adminPostsTableBody.innerHTML = '';
        if (posts.length === 0) {
            adminPostsTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-gray-400 py-4">No hay publicaciones.</td></tr>`;
            return;
        }

        posts.forEach(post => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${post._id.slice(-6)}</td> <td>${post.name}</td>
                <td>${post.type}</td>
                <td>${post.message.length > 50 ? post.message.substring(0, 50) + '...' : post.message}</td>
                <td>${new Date(post.date).toLocaleDateString('es-AR')}</td>
                <td>
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${post.approved ? 'bg-green-600' : 'bg-red-600'}">
                        ${post.approved ? 'Sí' : 'No'}
                    </span>
                </td>
                <td>${post.comments ? post.comments.length : 0}</td>
                <td class="whitespace-nowrap">
                    <button data-id="${post._id}" data-approved="${post.approved}" class="toggle-approval-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mr-2">
                        ${post.approved ? 'Desaprobar' : 'Aprobar'}
                    </button>
                    <button data-id="${post._id}" class="edit-post-btn bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-3 py-1 rounded text-sm mr-2">
                        Editar
                    </button>
                    <button data-id="${post._id}" class="delete-post-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                        Eliminar
                    </button>
                </td>
            `;
            adminPostsTableBody.appendChild(row);
        });

        // Añadir event listeners a los botones
        adminPostsTableBody.querySelectorAll('.toggle-approval-btn').forEach(btn => {
            btn.addEventListener('click', handleToggleApproval);
        });
        adminPostsTableBody.querySelectorAll('.edit-post-btn').forEach(btn => {
            btn.addEventListener('click', handleEditPost);
        });
        adminPostsTableBody.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', handleDeletePost);
        });
    };

    const handleToggleApproval = async (e) => {
        const postId = e.target.dataset.id;
        const currentApproved = e.target.dataset.approved === 'true'; // Convertir a booleano
        const newApprovedStatus = !currentApproved;

        if (!confirm(`¿Estás seguro de que quieres ${newApprovedStatus ? 'aprobar' : 'desaprobar'} este post?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/posts/${postId}/approve`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ approved: newApprovedStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cambiar estado de aprobación.');
            }

            showAdminToast(`Post ${newApprovedStatus ? 'aprobado' : 'desaprobado'} con éxito.`);
            fetchAdminPosts(); // Recargar la tabla
        } catch (error) {
            console.error('Error al cambiar aprobación:', error);
            showAdminToast(`Error: ${error.message}`, true);
        }
    };

    const handleDeletePost = async (e) => {
        const postId = e.target.dataset.id;

        if (!confirm('¿Estás seguro de que quieres eliminar este post? Esta acción es irreversible.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/posts/${postId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el post.');
            }

            showAdminToast('Post eliminado con éxito.');
            fetchAdminPosts(); // Recargar la tabla
        } catch (error) {
            console.error('Error al eliminar post:', error);
            showAdminToast(`Error: ${error.message}`, true);
        }
    };

    const handleEditPost = async (e) => {
        const postId = e.target.dataset.id;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/posts/${postId}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo cargar el post para editar.');
            }

            const post = await response.json();
            editPostIdInput.value = post._id;
            editNameInput.value = post.name;
            editTypeSelect.value = post.type;
            editMessageTextarea.value = post.message;

            // Renderizar comentarios
            editCommentsList.innerHTML = '';
            if (post.comments && post.comments.length > 0) {
                noCommentsMessage.classList.add('hidden');
                post.comments.forEach(comment => {
                    const commentElement = document.createElement('div');
                    commentElement.classList.add('bg-gray-600', 'p-2', 'rounded-md', 'mb-2', 'flex', 'justify-between', 'items-center');
                    commentElement.innerHTML = `
                        <div>
                            <p class="text-sm text-gray-300">${comment.text}</p>
                            <p class="text-xs text-gray-400 mt-1">Por: ${comment.name} el ${new Date(comment.date).toLocaleDateString('es-AR')}</p>
                        </div>
                        <button data-post-id="${post._id}" data-comment-id="${comment._id}" class="delete-comment-btn text-red-300 hover:text-red-500 text-sm ml-4 focus:outline-none">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    `;
                    editCommentsList.appendChild(commentElement);
                });
                editCommentsList.querySelectorAll('.delete-comment-btn').forEach(btn => {
                    btn.addEventListener('click', handleDeleteComment);
                });
            } else {
                noCommentsMessage.classList.remove('hidden');
            }

            editPostModal.classList.remove('hidden');
        } catch (error) {
            console.error('Error al cargar post para edición:', error);
            showAdminToast(`Error: ${error.message}`, true);
        }
    };

    closeEditModalBtn.addEventListener('click', () => {
        editPostModal.classList.add('hidden');
    });

    editPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const postId = editPostIdInput.value;
        const updatedPostData = {
            name: editNameInput.value.trim(),
            type: editTypeSelect.value,
            message: editMessageTextarea.value.trim()
        };

        try {
            const response = await fetch(`${API_BASE_URL}/admin/posts/${postId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedPostData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar cambios.');
            }

            showAdminToast('Post actualizado con éxito.');
            editPostModal.classList.add('hidden');
            fetchAdminPosts(); // Recargar la tabla
        } catch (error) {
            console.error('Error al actualizar post:', error);
            showAdminToast(`Error: ${error.message}`, true);
        }
    });

    const handleDeleteComment = async (e) => {
        const postId = e.currentTarget.dataset.postId;
        const commentId = e.currentTarget.dataset.commentId;

        if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/posts/${postId}/comments/${commentId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar comentario.');
            }

            showAdminToast('Comentario eliminado con éxito.');
            // Re-fetch el post para actualizar los comentarios en el modal
            // O una solución más fina sería eliminar el elemento del DOM directamente
            handleEditPost({ target: { dataset: { id: postId } } }); // Llama a la función de editar para refrescar el modal
        } catch (error) {
            console.error('Error al eliminar comentario:', error);
            showAdminToast(`Error: ${error.message}`, true);
        }
    };


    // --- Inicialización ---
    toggleAdminViews(); // Comprueba el token al cargar la página
});