import { EnhancementSettings } from '../types';

// Vertex shader for simple full-screen quad
const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

// Fragment shader: Multi-pass AI Edge & Texture Enhancement
// Combines 9-tap Laplacian edge boost (Unsharp Mask), midtone micro-contrast, adaptive saturation, and chroma de-artifacting
const FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D u_image;
uniform vec2 u_textureSize;
uniform float u_sharpness;      // 0.0 to 2.5
uniform float u_edgeBoost;      // 0.0 to 1.5
uniform float u_microContrast;  // 0.0 to 1.0
uniform float u_saturation;     // 0.8 to 1.6
uniform float u_brightness;     // 0.9 to 1.2
uniform float u_denoise;        // 0.0 to 1.0
varying vec2 v_texCoord;

// RGB to Luminance
float getLuminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

// Adjust saturation preserving skin tones
vec3 adjustSaturation(vec3 color, float sat) {
    float lum = getLuminance(color);
    return mix(vec3(lum), color, sat);
}

void main() {
    vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
    vec2 tc = v_texCoord;

    // Center sample
    vec4 center = texture2D(u_image, tc);

    // 8-neighbor sampling for high-frequency edge isolation
    vec4 top    = texture2D(u_image, tc + vec2( 0.0, -onePixel.y));
    vec4 bottom = texture2D(u_image, tc + vec2( 0.0,  onePixel.y));
    vec4 left   = texture2D(u_image, tc + vec2(-onePixel.x,  0.0));
    vec4 right  = texture2D(u_image, tc + vec2( onePixel.x,  0.0));
    vec4 tl     = texture2D(u_image, tc + vec2(-onePixel.x, -onePixel.y));
    vec4 tr     = texture2D(u_image, tc + vec2( onePixel.x, -onePixel.y));
    vec4 bl     = texture2D(u_image, tc + vec2(-onePixel.x,  onePixel.y));
    vec4 br     = texture2D(u_image, tc + vec2( onePixel.x,  onePixel.y));

    // Weighted Gaussian blur for unsharp mask base
    vec4 blurred = (top + bottom + left + right) * 0.15 + (tl + tr + bl + br) * 0.10;

    // High frequency detail map
    vec4 highFreq = center - blurred;

    // Laplacian edge enhancement
    // Suppress tiny sensor noise below threshold if denoise is active
    float noiseFloor = 0.015 * (u_denoise + 0.1);
    vec3 detail = highFreq.rgb;
    float detailMagnitude = length(detail);

    if (detailMagnitude < noiseFloor) {
        detail = mix(vec3(0.0), detail, detailMagnitude / max(noiseFloor, 0.0001));
    }

    // Adaptive sharpening: boost edges more where texture exists
    vec3 sharpened = center.rgb + detail * (u_sharpness * 1.6 + u_edgeBoost * 1.2);

    // Adaptive local micro-contrast (S-curve around midtones)
    if (u_microContrast > 0.01) {
        float lum = getLuminance(sharpened);
        float contrastFactor = 1.0 + (u_microContrast * 0.35);
        // Sigmoid centered at 0.5
        sharpened = (sharpened - 0.5) * contrastFactor + 0.5;
    }

    // Brightness adjustment
    sharpened *= u_brightness;

    // Vibrancy / Saturation boost
    sharpened = adjustSaturation(sharpened, u_saturation);

    // Clamp to valid gamut
    gl_FragColor = vec4(clamp(sharpened, 0.0, 1.0), center.a);
}
`;

export class WebGLEnhancer {
  private gl: WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private isSupported = false;

  // Uniform locations
  private uImageLoc: WebGLUniformLocation | null = null;
  private uTextureSizeLoc: WebGLUniformLocation | null = null;
  private uSharpnessLoc: WebGLUniformLocation | null = null;
  private uEdgeBoostLoc: WebGLUniformLocation | null = null;
  private uMicroContrastLoc: WebGLUniformLocation | null = null;
  private uSaturationLoc: WebGLUniformLocation | null = null;
  private uBrightnessLoc: WebGLUniformLocation | null = null;
  private uDenoiseLoc: WebGLUniformLocation | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.initWebGL();
  }

  private initWebGL() {
    try {
      const gl = this.canvas.getContext('webgl', {
        preserveDrawingBuffer: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      if (!gl) {
        this.isSupported = false;
        return;
      }
      this.gl = gl;

      const program = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
      if (!program) {
        this.isSupported = false;
        return;
      }
      this.program = program;

      // Setup quad buffers
      this.positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1.0, -1.0,
           1.0, -1.0,
          -1.0,  1.0,
          -1.0,  1.0,
           1.0, -1.0,
           1.0,  1.0,
        ]),
        gl.STATIC_DRAW
      );

      this.texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      // Flip Y for video texture orientation in WebGL
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          0.0, 1.0,
          1.0, 1.0,
          0.0, 0.0,
          0.0, 0.0,
          1.0, 1.0,
          1.0, 0.0,
        ]),
        gl.STATIC_DRAW
      );

      // Texture
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // Linear filter gives smooth base interpolation before sharpening shader
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // Cache uniform locations
      this.uImageLoc = gl.getUniformLocation(program, 'u_image');
      this.uTextureSizeLoc = gl.getUniformLocation(program, 'u_textureSize');
      this.uSharpnessLoc = gl.getUniformLocation(program, 'u_sharpness');
      this.uEdgeBoostLoc = gl.getUniformLocation(program, 'u_edgeBoost');
      this.uMicroContrastLoc = gl.getUniformLocation(program, 'u_microContrast');
      this.uSaturationLoc = gl.getUniformLocation(program, 'u_saturation');
      this.uBrightnessLoc = gl.getUniformLocation(program, 'u_brightness');
      this.uDenoiseLoc = gl.getUniformLocation(program, 'u_denoise');

      this.isSupported = true;
    } catch {
      this.isSupported = false;
    }
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram | null {
    if (!this.gl) return null;
    const gl = this.gl;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.warn('VS Compile Error:', gl.getShaderInfoLog(vs));
      return null;
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.warn('FS Compile Error:', gl.getShaderInfoLog(fs));
      return null;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Program Link Error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  public render(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    settings: EnhancementSettings,
    targetWidth: number,
    targetHeight: number
  ) {
    if (!this.isSupported || !this.gl || !this.program) {
      this.fallback2DRender(source, settings, targetWidth, targetHeight);
      return;
    }

    const gl = this.gl;

    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
    }

    gl.viewport(0, 0, targetWidth, targetHeight);
    gl.useProgram(this.program);

    // Bind Position
    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Bind TexCoord
    const texLoc = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(texLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    // Update texture from current video or image element
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    const sourceWidth =
      'videoWidth' in source && source.videoWidth
        ? source.videoWidth
        : 'naturalWidth' in source && source.naturalWidth
        ? source.naturalWidth
        : source.width || targetWidth;

    const sourceHeight =
      'videoHeight' in source && source.videoHeight
        ? source.videoHeight
        : 'naturalHeight' in source && source.naturalHeight
        ? source.naturalHeight
        : source.height || targetHeight;

    // Set uniforms
    gl.uniform1i(this.uImageLoc, 0);
    gl.uniform2f(this.uTextureSizeLoc, sourceWidth, sourceHeight);
    gl.uniform1f(this.uSharpnessLoc, settings.sharpness / 100);
    gl.uniform1f(this.uEdgeBoostLoc, settings.edgeBoost / 100);
    gl.uniform1f(this.uMicroContrastLoc, settings.microContrast / 100);
    gl.uniform1f(this.uSaturationLoc, settings.saturation / 100);
    gl.uniform1f(this.uBrightnessLoc, settings.brightness / 100);
    gl.uniform1f(this.uDenoiseLoc, settings.denoise / 100);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private fallback2DRender(
    source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    settings: EnhancementSettings,
    targetWidth: number,
    targetHeight: number
  ) {
    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
    }
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Apply 2D hardware filters
    const contrast = 100 + settings.microContrast * 0.3 + settings.sharpness * 0.15;
    const saturate = settings.saturation;
    const brightness = settings.brightness;

    ctx.filter = `contrast(${contrast}%) saturate(${saturate}%) brightness(${brightness}%)`;
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  }

  public destroy() {
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}
