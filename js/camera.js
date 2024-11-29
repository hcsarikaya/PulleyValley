class Camera {
    constructor(gl) {
        this.gl = gl;

        // Camera properties
        this.position = vec3.fromValues(0, 5, 10);
        this.target = vec3.fromValues(0, 0, 0);
        this.up = vec3.fromValues(0, 1, 0);

        // Matrices
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();

        // Camera movement parameters
        this.moveSpeed = 0.1;
        this.rotationSpeed = 0.02;
    }

    // Initialize projection matrix
    initProjection(width, height) {
        const fieldOfView = Math.PI / 4;
        const aspect = width / height;
        const zNear = 0.1;
        const zFar = 100.0;

        mat4.perspective(
            this.projectionMatrix,
            fieldOfView,
            aspect,
            zNear,
            zFar
        );
    }

    // Update view matrix
    updateViewMatrix() {
        mat4.lookAt(
            this.viewMatrix,
            this.position,
            this.target,
            this.up
        );
    }

    // Translate camera
    move(direction) {
        const moveVector = vec3.create();

        // Calculate move direction
        switch(direction) {
            case 'FORWARD':
                vec3.subtract(moveVector, this.target, this.position);
                vec3.normalize(moveVector, moveVector);
                vec3.scale(moveVector, moveVector, this.moveSpeed);
                break;
            case 'BACKWARD':
                vec3.subtract(moveVector, this.position, this.target);
                vec3.normalize(moveVector, moveVector);
                vec3.scale(moveVector, moveVector, this.moveSpeed);
                break;
            case 'LEFT':
                const left = vec3.create();
                vec3.cross(left, this.up, moveVector);
                vec3.normalize(left, left);
                vec3.scale(left, left, this.moveSpeed);
                vec3.add(this.position, this.position, left);
                break;
            case 'RIGHT':
                const right = vec3.create();
                vec3.cross(right, moveVector, this.up);
                vec3.normalize(right, right);
                vec3.scale(right, right, this.moveSpeed);
                vec3.add(this.position, this.position, right);
                break;
        }

        // Update position and view matrix
        vec3.add(this.position, this.position, moveVector);
        this.updateViewMatrix();
    }

    // Rotate camera
    rotate(pitch, yaw) {
        // Create rotation matrix
        const rotationMatrix = mat4.create();
        mat4.rotate(rotationMatrix, rotationMatrix, pitch, [1, 0, 0]);
        mat4.rotate(rotationMatrix, rotationMatrix, yaw, [0, 1, 0]);

        // Apply rotation to camera position
        const rotatedPosition = vec3.create();
        vec3.transformMat4(rotatedPosition, this.position, rotationMatrix);

        this.position = rotatedPosition;
        this.updateViewMatrix();
    }

    // Setup input handlers
    setupControls() {
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'w': this.move('FORWARD'); break;
                case 's': this.move('BACKWARD'); break;
                case 'a': this.move('LEFT'); break;
                case 'd': this.move('RIGHT'); break;
            }
        });

        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.gl.canvas.addEventListener('mousedown', (event) => {
            isDragging = true;
            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        });

        this.gl.canvas.addEventListener('mousemove', (event) => {
            if (!isDragging) return;

            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            this.rotate(
                deltaMove.y * this.rotationSpeed,  // pitch
                deltaMove.x * this.rotationSpeed   // yaw
            );

            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        });

        this.gl.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
}