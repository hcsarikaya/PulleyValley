import * as THREE from 'three';

export class CameraControls {
    constructor(camera, renderer, options = {}) {
        this.camera = camera;
        this.renderer = renderer;

        // Serbest uçuş (free-fly) için ayarlar
        this.freeMoveSpeed = options.freeMoveSpeed || 0.2;
        this.mouseSensitivity = options.mouseSensitivity || 0.002;

        // Kamera mod kontrolü
        this.isFreeMode = false;

        // Kamera Euler açıları (serbest moda geçtiğimizde kullanıyoruz)
        this.pitch = 0;  // X ekseni etrafında dönme
        this.yaw = 0;    // Y ekseni etrafında dönme

        // Hangi tuşlara basılı tutuyoruz?
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };

        // Odadaki sınırlara ek olarak kameranın "hitbox" yarıçapı.
        // Bu sayede, duvara tam yapışmadan önce çarpışma olduğunu varsayacağız.
        this.cameraCollisionRadius = 0.1; // Daha küçük yaparsanız duvara daha çok yaklaşabilirsiniz.

        // Sınırlar (örnek değerler)
        this.bounds = {  //TODO room sizea göre ayarlanacak
            min: new THREE.Vector3(-20, 0, -20),
            max: new THREE.Vector3( 20, 20, 20)
        };

        // Event listener tanımları
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup',   (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    /**
     * "P" tuşuna basıldığında mod değiştiriyoruz
     * Normal mod <--> Serbest uçuş (free-fly) mod
     */
    toggleCameraMode() {
        this.isFreeMode = !this.isFreeMode;
        if (this.isFreeMode) {
            // Fareyi yakalıyoruz (pointer lock)
            this.renderer.domElement.requestPointerLock();

            // Mevcut kamera yönünü Euler açılara çeviriyoruz
            const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
            this.yaw = euler.y;
            this.pitch = euler.x;

            console.log('Serbest uçuş moduna geçildi.');
        } else {
            // Pointer lock’tan çık
            document.exitPointerLock();
            console.log('Normal moda geçildi.');
        }
    }

    /**
     * Klavyeden tuşa basma
     */
    onKeyDown(event) {
        switch (event.key.toLowerCase()) {
            case 'p':
                // Kamera modunu değiştir
                this.toggleCameraMode();
                break;
            case 'w':
                this.keys.w = true;
                break;
            case 'a':
                this.keys.a = true;
                break;
            case 's':
                this.keys.s = true;
                break;
            case 'd':
                this.keys.d = true;
                break;
            default:
                break;
        }
    }

    /**
     * Klavyeden tuşu bırakma
     */
    onKeyUp(event) {
        switch (event.key.toLowerCase()) {
            case 'w':
                this.keys.w = false;
                break;
            case 'a':
                this.keys.a = false;
                break;
            case 's':
                this.keys.s = false;
                break;
            case 'd':
                this.keys.d = false;
                break;
            default:
                break;
        }
    }

    /**
     * Fare hareketleri (sadece serbest moddayken işlem yap)
     */
    onMouseMove(event) {
        if (!this.isFreeMode) return;

        // Pointer lock aktif mi kontrol et
        if (document.pointerLockElement !== this.renderer.domElement) return;

        // Fare hareketine göre yaw ve pitch değerlerini güncelle
        this.yaw   -= event.movementX * this.mouseSensitivity;
        this.pitch -= event.movementY * this.mouseSensitivity;

        // Pitch değerini (-90°, +90°) aralığında sınırlıyoruz
        const maxPitch = Math.PI / 2 - 0.1;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    }

    /**
     * Her karede çağrılacak update fonksiyonu
     */
    update(delta) {
        if (!this.isFreeMode) {
            // Normal moda ait kamera davranışları
            return;
        }

        // --- Serbest uçuş modunda kamera dönüşü ---
        const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);

        // Kamera yön vektörlerini belirle
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right   = new THREE.Vector3(1, 0,  0).applyQuaternion(this.camera.quaternion);

        // Delta (örneğin ms cinsinden) ile hız çarpmasını eklemek isterseniz:
        const moveSpeed = this.freeMoveSpeed * (delta || 1);

        // WASD hareketi
        if (this.keys.w) {
            this.camera.position.addScaledVector(forward, moveSpeed);
        }
        if (this.keys.s) {
            this.camera.position.addScaledVector(forward, -moveSpeed);
        }
        if (this.keys.a) {
            this.camera.position.addScaledVector(right, -moveSpeed);
        }
        if (this.keys.d) {
            this.camera.position.addScaledVector(right, moveSpeed);
        }

        // --- Kameranın konumunu sınırlara göre “clamp” et ---
        // Kamera çarpışma yarıçapını hesaba katmak için min/max'e offset ekliyoruz
        // Pozisyonun x, y, z'ini sırasıyla düzelt
        this.camera.position.x = Math.max(
            this.bounds.min.x + this.cameraCollisionRadius,
            Math.min(this.bounds.max.x - this.cameraCollisionRadius, this.camera.position.x)
        );

        this.camera.position.y = Math.max(
            this.bounds.min.y + this.cameraCollisionRadius,
            Math.min(this.bounds.max.y - this.cameraCollisionRadius, this.camera.position.y)
        );

        this.camera.position.z = Math.max(
            this.bounds.min.z + this.cameraCollisionRadius,
            Math.min(this.bounds.max.z - this.cameraCollisionRadius, this.camera.position.z)
        );
    }
}
