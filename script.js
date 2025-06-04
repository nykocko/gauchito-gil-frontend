document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const petitionModal = document.getElementById('petitionModal');
    const petitionForm = document.getElementById('petitionForm');
    const postsContainer = document.getElementById('postsContainer');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const toast = document.getElementById('toast');

    // Nuevas variables para paginación
    const postsPerPage = 15; // Cantidad de posts por página
    let currentPage = 1;     // Página actual
    let currentFilter = 'all'; // Variable para mantener el filtro actual
    const paginationControls = document.getElementById('paginationControls'); // Contenedor para la paginación

    // Elementos de validación del formulario
    const typeSelect = document.getElementById('type');
    const messageTextArea = document.getElementById('message');
    const typeError = document.getElementById('typeError');
    const messageError = document.getElementById('messageError');

    // Array para almacenar peticiones y testimonios. Ahora se llenará desde el backend.
    let posts = []; // IMPORTANTE: Eliminamos la carga desde localStorage

    // URL base del backend. ¡IMPORTANTE: DEBES CAMBIAR ESTO A LA URL DE TU BACKEND EN RENDER UNA VEZ DESPLEGADO!
    // EJEMPLO: const API_BASE_URL = 'https://nombre-de-tu-backend.onrender.com/api';
    const API_BASE_URL = 'https://gauchito-gil-api.onrender.com'; // Por ahora, sigue siendo localhost para pruebas locales

    // --- Funciones de Utilidad ---

    // Función para mostrar el modal de petición
    const toggleModal = () => {
        petitionModal.classList.toggle('hidden');
        if (!petitionModal.classList.contains('hidden')) {
            // Cuando se abre el modal, resetear y limpiar validaciones
            petitionForm.reset();
            typeError.classList.add('hidden');
            messageError.classList.add('hidden');
        }
    };

    // Función para mostrar el toast (mensaje de éxito)
    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000); // El toast desaparece después de 3 segundos
    };

    // --- Funciones de Fetching de Datos (Interacción con Backend) ---

    // Función para obtener posts aprobados del backend
    const fetchPosts = async (filterType = currentFilter) => {
        try {
            // La ruta /api/posts ya devuelve solo los posts aprobados
            const response = await fetch(`${API_BASE_URL}/posts`);
            
            if (!response.ok) {
                throw new Error(`Error al cargar los posts: ${response.statusText}`);
            }
            
            let fetchedPosts = await response.json();

            // Actualizar el array global 'posts' con los datos del backend
            posts = fetchedPosts; 

            // Ahora, aplica el filtro de tipo (testimonio/petición/todos) localmente en el frontend
            let filteredPosts = [];
            if (filterType === 'testimonio') {
                filteredPosts = posts.filter(p => p.type === 'testimonio');
            } else if (filterType === 'peticion') {
                filteredPosts = posts.filter(p => p.type === 'peticion');
            } else { // 'all'
                filteredPosts = posts; 
            }

            // Recalcular la paginación y renderizar
            currentPage = 1; // Siempre resetear a la página 1 al cambiar el filtro
            renderAllPosts(currentFilter, filteredPosts); // Pasar los posts filtrados a renderAllPosts

        } catch (error) {
            console.error('Error al cargar los posts:', error);
            postsContainer.innerHTML = `<p class="text-center text-red-300 mt-8">Error al cargar las publicaciones. Por favor, inténtalo de nuevo más tarde.</p>`;
        }
    };

    // --- Funciones de Renderizado ---

    // Función para renderizar un único post
    const renderPost = (post) => {
        const postElement = document.createElement('div');
        postElement.classList.add('post-card', 'bg-red-800', 'p-6', 'rounded-lg', 'shadow-lg');
        postElement.innerHTML = `
            <h3 class="text-xl font-merriweather font-bold text-yellow-300">${post.type === 'testimonio' ? 'Testimonio' : 'Petición'}</h3>
            <p class="text-gray-300 text-sm mt-1">Por: ${post.name} el ${new Date(post.date).toLocaleDateString('es-AR')}</p>
            <p class="mt-4 text-gray-200">${post.message}</p>
            <button class="toggle-comments-btn mt-4 text-yellow-400 hover:text-yellow-200 transition-colors duration-200 focus:outline-none">
                Ver Comentarios (${post.comments ? post.comments.length : 0})
            </button>
            <div class="comments-section mt-4 hidden">
                <h4 class="text-lg font-merriweather font-semibold text-yellow-300 mb-2">Comentarios:</h4>
                <div class="comments-list">
                    ${post.comments && post.comments.length > 0 ? 
                        post.comments.map(comment => `
                            <div class="bg-red-700 p-3 rounded-md mb-2">
                                <p class="text-sm text-gray-300">${comment.text}</p>
                                <p class="text-xs text-gray-400 mt-1">Por: ${comment.name} el ${new Date(comment.date).toLocaleDateString('es-AR')}</p>
                            </div>
                        `).join('')
                        : '<p class="text-gray-400 text-sm">No hay comentarios aún.</p>'
                    }
                </div>
                <form class="comment-form mt-4">
                    <input type="hidden" name="postId" value="${post._id}"> <input type="text" name="commentName" placeholder="Tu Nombre (Opcional)" class="w-full p-2 rounded bg-red-700 border border-yellow-700 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500">
                    <textarea name="commentText" rows="2" placeholder="Añade un comentario..." required class="w-full p-2 mt-2 rounded bg-red-700 border border-yellow-700 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"></textarea>
                    <button type="submit" class="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50">
                        Añadir Comentario
                    </button>
                </form>
            </div>
        `;

        // Lógica para toggle de comentarios
        const toggleBtn = postElement.querySelector('.toggle-comments-btn');
        const commentsSection = postElement.querySelector('.comments-section');
        toggleBtn.addEventListener('click', () => {
            commentsSection.classList.toggle('hidden');
            if (!commentsSection.classList.contains('hidden')) {
                toggleBtn.textContent = `Ocultar Comentarios (${post.comments ? post.comments.length : 0})`;
            } else {
                toggleBtn.textContent = `Ver Comentarios (${post.comments ? post.comments.length : 0})`;
            }
        });

        // Lógica para enviar comentarios
        const commentForm = postElement.querySelector('.comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const postId = commentForm.querySelector('input[name="postId"]').value;
                const commentText = commentForm.querySelector('textarea[name="commentText"]').value.trim();
                const commentName = commentForm.querySelector('input[name="commentName"]').value.trim();

                if (!commentText) {
                    showToast('El comentario no puede estar vacío.');
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            text: commentText, 
                            name: commentName || 'Anónimo' // Usa "Anónimo" si el nombre está vacío
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Error al añadir comentario.');
                    }

                    const newComment = await response.json(); // El backend devuelve el comentario recién creado
                    showToast('Comentario añadido con éxito!');
                    
                    // Actualizar la UI: Encuentra el post en tu array 'posts' y actualiza sus comentarios
                    const updatedPostIndex = posts.findIndex(p => p._id === postId);
                    if (updatedPostIndex !== -1) {
                        posts[updatedPostIndex].comments.push(newComment);
                        // Vuelve a renderizar todos los posts para reflejar el cambio
                        fetchPosts(currentFilter); 
                    }
                    
                    // Limpiar el formulario de comentario
                    commentForm.reset();

                } catch (error) {
                    console.error('Error al añadir comentario:', error);
                    showToast(`Error: ${error.message}`);
                }
            });
        }

        return postElement;
    };

    // Función para renderizar todos los posts (con paginación y filtro)
    const renderAllPosts = (filter = 'all', postsToRender = posts) => {
        // Calcula el número total de páginas basado en los posts filtrados
        const totalPages = Math.ceil(postsToRender.length / postsPerPage);
        
        // Ajusta currentPage si es necesario
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        } else if (currentPage === 0 && totalPages > 0) {
            currentPage = 1;
        }

        const startIndex = (currentPage - 1) * postsPerPage;
        const endIndex = startIndex + postsPerPage;
        const postsToShow = postsToRender.slice(startIndex, endIndex);

        postsContainer.innerHTML = ''; // Limpiar el contenedor antes de añadir nuevos posts

        if (postsToShow.length === 0) {
            postsContainer.innerHTML = `<p class="text-center text-yellow-300 mt-8">No hay ${currentFilter === 'testimonio' ? 'testimonios' : currentFilter === 'peticion' ? 'peticiones' : 'publicaciones'} para mostrar en esta sección aún.</p>`;
        } else {
            postsToShow.forEach(post => {
                postsContainer.appendChild(renderPost(post));
            });
        }

        renderPaginationControls(totalPages);
    };

    // Función para crear un botón de paginación
    const createPaginationButton = (text, page, isActive = false, isDisabled = false) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add(
            'mx-1', 'px-3', 'py-1', 'rounded', 'font-bold',
            'bg-yellow-600', 'hover:bg-yellow-700', 'text-white',
            'transition-colors', 'duration-200'
        );
        if (isActive) {
            button.classList.add('bg-yellow-400', 'text-red-900', 'hover:bg-yellow-400');
        }
        if (isDisabled) {
            button.disabled = true;
            button.classList.add('opacity-50', 'cursor-not-allowed', 'hover:bg-yellow-600');
        }
        button.addEventListener('click', () => {
            if (!isDisabled) {
                currentPage = page;
                fetchPosts(currentFilter); // Vuelve a cargar los posts con la nueva página y filtro actual
            }
        });
        return button;
    };

    // Función para renderizar los controles de paginación
    const renderPaginationControls = (totalPages) => {
        paginationControls.innerHTML = ''; // Limpiar controles existentes

        if (totalPages <= 1) {
            return; // No mostrar paginación si solo hay una página
        }

        // Botón Anterior
        paginationControls.appendChild(createPaginationButton('Anterior', currentPage - 1, false, currentPage === 1));

        // Botones de número de página con elipsis
        const maxPageButtons = 5; // Número máximo de botones de página visibles
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

        if (endPage - startPage + 1 < maxPageButtons) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        if (startPage > 1) {
            paginationControls.appendChild(createPaginationButton('1', 1));
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.classList.add('mx-1', 'text-gray-400');
                ellipsis.textContent = '...';
                paginationControls.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationControls.appendChild(createPaginationButton(i.toString(), i, i === currentPage));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.classList.add('mx-1', 'text-gray-400');
                ellipsis.textContent = '...';
                paginationControls.appendChild(ellipsis);
            }
            paginationControls.appendChild(createPaginationButton(totalPages.toString(), totalPages));
        }

        // Botón Siguiente
        paginationControls.appendChild(createPaginationButton('Siguiente', currentPage + 1, false, currentPage === totalPages));
    };

    // --- Manejadores de Eventos ---

    // Abrir modal de petición
    openModalBtn.addEventListener('click', toggleModal);
    // Cerrar modal de petición
    closeModalBtn.addEventListener('click', toggleModal);
    // Cerrar modal al hacer clic fuera del contenido
    petitionModal.addEventListener('click', (e) => {
        if (e.target === petitionModal) {
            toggleModal();
        }
    });

    // Validar formulario de petición
    const validateForm = () => {
        let isValid = true;

        if (typeSelect.value === '') {
            typeError.classList.remove('hidden');
            isValid = false;
        } else {
            typeError.classList.add('hidden');
        }

        if (messageTextArea.value.trim().length < 10) {
            messageError.classList.remove('hidden');
            isValid = false;
        } else {
            messageError.classList.add('hidden');
        }
        return isValid;
    };

    // Enviar formulario de petición al backend
    petitionForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const isFormValid = validateForm();

        if (isFormValid) {
            const newPostData = {
                name: document.getElementById('name').value.trim(),
                type: typeSelect.value,
                message: messageTextArea.value,
            };

            try {
                const response = await fetch(`${API_BASE_URL}/posts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newPostData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al enviar el mensaje.');
                }

                const savedPost = await response.json();
                console.log('Post enviado:', savedPost); // savedPost tendrá approved: false

                // Limpiar formulario y cerrar modal
                petitionForm.reset();
                toggleModal();
                
                // Mostrar mensaje de éxito. El post no se mostrará inmediatamente en la vista pública
                // porque necesita ser aprobado por el admin.
                showToast('¡Mensaje enviado con éxito! Será revisado por un administrador.');

            } catch (error) {
                console.error('Error al enviar el mensaje:', error);
                showToast(`Error: ${error.message}`); // Muestra un mensaje de error más específico
            }
        }
    });

    // Manejar filtros
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover la clase 'active-filter' de todos los botones
            filterButtons.forEach(btn => btn.classList.remove('active-filter'));
            // Añadir la clase 'active-filter' al botón clickeado
            button.classList.add('active-filter');

            // Actualizar la variable currentFilter para mantener el estado
            if (button.id === 'filterMiracles') {
                currentFilter = 'testimonio';
            } else if (button.id === 'filterPetitions') {
                currentFilter = 'peticion';
            } else { // Asumimos que es 'filterAll' o cualquier otro que sea para 'todos'
                currentFilter = 'all';
            }
            fetchPosts(currentFilter); // Llama a fetchPosts con el nuevo filtro
        });
    });

    // --- Inicialización ---

    // Asegurar que el botón 'Todos' esté activo al cargar la página y que el currentFilter se inicialice
    const filterAllBtn = document.getElementById('filterAll');
    if (filterAllBtn) { // Verificar si el botón existe
        filterAllBtn.classList.add('active-filter');
        currentFilter = 'all'; // Asegurarse de que el filtro inicial sea 'all'
    }

    // Cargar los posts al inicio
    fetchPosts();
});