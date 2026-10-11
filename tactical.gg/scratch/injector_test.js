
  // --- tactical PERFORMANCE OPTIMIZATION INJECTOR ---
  
  // 1. Force LocalStorage settings to optimized graphics for maximum FPS
  const optims = {
    'tactical_quality': 'low',
    'tactical_shadows': 'off',
    'tactical_bloom': '0',
    'tactical_fxaa': '0',
    'tactical_aa': 'off',
    'tactical_aniso': '1',
    'tactical_res': '0.75',
    'tactical_fpscap': '0',
    'tactical_showfps3': '1',
    'tactical_hwaccel_ok': '1',
    'tactical_chfollow': '1',
    'tactical_xhair': JSON.stringify({
      style: 1,
      dot: 0,
      len: 1,
      thick: 2,
      gap: 1,
      outline: 1,
      outw: 1,
      color: 1,
      r: 60,
      g: 255,
      b: 90,
      alpha: 255,
      t: 0,
      sniper: 2,
      hit: 1,
      snipehide: 0
    })
  };
  for (let key in optims) {
    localStorage.setItem(key, optims[key]);
  }

  // 2. Force WebGL High-Performance Mode & Disable Anti-Aliasing at the hardware level
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, attributes) {
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      attributes = attributes || {};
      attributes.powerPreference = "high-performance";
      attributes.antialias = false; 
    }
    const gl = originalGetContext.call(this, type, attributes);
    if (gl) installHooks(gl);
    return gl;
  };

  // Rewrite URLs for mobile GLB
  function rewriteAssetUrl(url) {
    if (typeof url !== 'string') return url;
    let newUrl = url.replace(/^https?:\/\/assets\.clutcher\.io\//, '/');
    newUrl = newUrl.replace('_ktx.glb', '_mobile.glb');
    return newUrl;
  }
  
  const originalFetch = window.fetch;
  window.fetch = function() {
    if (typeof arguments[0] === 'string') {
      arguments[0] = rewriteAssetUrl(arguments[0]);
    } else if (arguments[0] instanceof Request) {
      const newUrl = rewriteAssetUrl(arguments[0].url);
      if (newUrl !== arguments[0].url) {
        arguments[0] = new Request(newUrl, arguments[0]);
      }
    }
    return originalFetch.apply(this, arguments);
  };
  
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    url = rewriteAssetUrl(url);
    return originalXHROpen.call(this, method, url, ...Array.prototype.slice.call(arguments, 2));
  };

  // 3. Skybox Protection & Detection
  const originalImageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  if (originalImageSrc && originalImageSrc.set) {
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      set: function(val) {
        if (typeof val === 'string' && (val.includes('sky_') || val.includes('skybox'))) {
          this._isSkybox = true;
        }
        return originalImageSrc.set.call(this, val);
      },
      get: originalImageSrc.get
    });
  }

  function isSkybox(source) {
    if (!source) return false;
    if (source._isSkybox) return true;
    if (typeof source.src === 'string' && (source.src.includes('sky_') || source.src.includes('skybox'))) return true;
    return false;
  }

  const ogDrawImage = CanvasRenderingContext2D.prototype.drawImage;
  const scratchCanvas = document.createElement('canvas');
  scratchCanvas._isScratch = true;
  scratchCanvas.width = 1;
  scratchCanvas.height = 1;
  const scratchCtx = scratchCanvas.getContext('2d');

  function downscaleSource(arg) {
    if (isSkybox(arg)) return arg;
    if (arg && (arg instanceof HTMLImageElement || (typeof ImageBitmap !== 'undefined' && arg instanceof ImageBitmap) || arg instanceof HTMLCanvasElement || (typeof OffscreenCanvas !== 'undefined' && arg instanceof OffscreenCanvas))) {
      if (arg._solidCanvas) return arg._solidCanvas;
      try {
        const w = arg.width || (arg.videoWidth || 1);
        const h = arg.height || (arg.videoHeight || 1);

        scratchCtx.clearRect(0, 0, 1, 1);
        ogDrawImage.call(scratchCtx, arg, 0, 0, 1, 1);

        let isNormalMap = false;
        try {
          const px = scratchCtx.getImageData(0, 0, 1, 1).data;
          if (Math.abs(px[0] - 128) < 30 && Math.abs(px[1] - 128) < 30 && px[2] > 170) {
            isNormalMap = true;
          }
        } catch(e) {}

        const c = document.createElement('canvas');
        c._isScratch = true;
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        if (isNormalMap) {
          ctx.fillStyle = 'rgb(128, 128, 255)';
          ctx.fillRect(0, 0, w, h);
        } else {
          ogDrawImage.call(ctx, scratchCanvas, 0, 0, 1, 1, 0, 0, w, h);
        }

        c._isSkybox = false;
        try { arg._solidCanvas = c; } catch(e) {}
        return c;
      } catch(e) {
        return arg;
      }
    }
    return arg;
  }

  CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
    if (localStorage.getItem('tactical_notextures') === '1') {
      if (image && isSkybox(image)) {
        this.canvas._isSkybox = true;
      } else if (image && !this.canvas._isScratch) {
        const canvasId = this.canvas.id || '';
        const srcStr = typeof image.src === 'string' ? image.src : '';
        const isUI = canvasId === 'radar' || canvasId === 'crosshair' ||
                     srcStr.includes('ui/') || srcStr.includes('radar');
        if (!isUI) {
          image = downscaleSource(image);
        }
      }
    }
    return ogDrawImage.call(this, image, ...args);
  };

  if (typeof OffscreenCanvasRenderingContext2D !== 'undefined') {
    const ogOffscreenDrawImage = OffscreenCanvasRenderingContext2D.prototype.drawImage;
    OffscreenCanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      if (localStorage.getItem('tactical_notextures') === '1') {
        if (image && isSkybox(image)) {
          this.canvas._isSkybox = true;
        } else if (image && !this.canvas._isScratch) {
          const srcStr = typeof image.src === 'string' ? image.src : '';
          const isUI = srcStr.includes('ui/') || srcStr.includes('radar');
          if (!isUI) {
            image = downscaleSource(image);
          }
        }
      }
      return ogOffscreenDrawImage.call(this, image, ...args);
    };
  }

  if (typeof createImageBitmap !== 'undefined') {
    const ogCreateImageBitmap = window.createImageBitmap;
    window.createImageBitmap = async function(source, ...args) {
      const bmp = await ogCreateImageBitmap.apply(this, arguments);
      if (localStorage.getItem('tactical_notextures') === '1') {
        if (!isSkybox(source) && !isSkybox(bmp)) {
          if (source && typeof source.src === 'string' && (source.src.includes('ui/') || source.src.includes('radar'))) {
            return bmp;
          }
          try {
            const solid = downscaleSource(bmp);
            if (solid && solid !== bmp) {
              return await ogCreateImageBitmap.call(window, solid);
            }
          } catch(e) {}
        }
      }
      return bmp;
    };
  }

  // 4. Format Checkers
  function isDxtFormat(f) {
    return f === 0x83A0 || f === 0x83A1 || f === 0x83A2 || f === 0x83A3 ||
           f === 0x8C4C || f === 0x8C4D || f === 0x8C4E || f === 0x8C4F ||
           f === 33776 || f === 33777 || f === 33778 || f === 33779 ||
           f === 35916 || f === 35917 || f === 35918 || f === 35919;
  }

  function isBc7Format(f) {
    return f === 0x8E8C || f === 0x8E8D || f === 36492 || f === 36493;
  }

  // 5. DXT (BC1 / BC3) Dominant Color Extractor & Generator
  function extractDxtColor(data, internalFormat) {
    const isDxt5 = (internalFormat === 0x83A3 || internalFormat === 33779 ||
                    internalFormat === 0x83A2 || internalFormat === 33778 ||
                    internalFormat === 0x8C4E || internalFormat === 35918 ||
                    internalFormat === 0x8C4F || internalFormat === 35919);
    const blockSize = isDxt5 ? 16 : 8;
    const colorOffset = isDxt5 ? 8 : 0;
    const len = data ? data.byteLength : 0;
    const numBlocks = Math.floor(len / blockSize);
    if (numBlocks <= 0) return [180, 170, 150];

    const step = Math.max(1, Math.floor(numBlocks / 128));
    let totalR = 0, totalG = 0, totalB = 0, count = 0;

    for (let i = 0; i < numBlocks; i += step) {
      const blockStart = i * blockSize;
      if (blockStart + blockSize > len) break;
      if (isDxt5) {
        const a0 = data[blockStart];
        const a1 = data[blockStart + 1];
        if (a0 < 20 && a1 < 20) continue; // skip transparent pixels for decals
      }
      const offset = blockStart + colorOffset;
      const c0 = data[offset] | (data[offset + 1] << 8);
      const c1 = data[offset + 2] | (data[offset + 3] << 8);

      const r0 = ((c0 >> 11) & 0x1F) * (255 / 31);
      const g0 = ((c0 >> 5) & 0x3F) * (255 / 63);
      const b0 = (c0 & 0x1F) * (255 / 31);

      const r1 = ((c1 >> 11) & 0x1F) * (255 / 31);
      const g1 = ((c1 >> 5) & 0x3F) * (255 / 63);
      const b1 = (c1 & 0x1F) * (255 / 31);

      totalR += (r0 + r1) * 0.5;
      totalG += (g0 + g1) * 0.5;
      totalB += (b0 + b1) * 0.5;
      count++;
    }

    if (count === 0) return [180, 170, 150];
    return [
      Math.round(totalR / count),
      Math.round(totalG / count),
      Math.round(totalB / count)
    ];
  }

  function createSolidDxtBuffer(r, g, b, internalFormat, byteLength) {
    const isDxt5 = (internalFormat === 0x83A3 || internalFormat === 33779 ||
                    internalFormat === 0x83A2 || internalFormat === 33778 ||
                    internalFormat === 0x8C4E || internalFormat === 35918 ||
                    internalFormat === 0x8C4F || internalFormat === 35919);
    const r5 = Math.round(r * 31 / 255) & 0x1F;
    const g6 = Math.round(g * 63 / 255) & 0x3F;
    const b5 = Math.round(b * 31 / 255) & 0x1F;
    const c = (r5 << 11) | (g6 << 5) | b5;

    const buf = new Uint8Array(byteLength);
    const view32 = new Uint32Array(buf.buffer);

    if (isDxt5) {
      const colorWord = (c & 0xFFFF) | ((c & 0xFFFF) << 16);
      for (let i = 0; i < view32.length; i += 4) {
        view32[i] = 0x0000FFFF;
        view32[i + 1] = 0x00000000;
        view32[i + 2] = colorWord;
        view32[i + 3] = 0x00000000;
      }
    } else {
      const colorWord = (c & 0xFFFF) | ((c & 0xFFFF) << 16);
      for (let i = 0; i < view32.length; i += 2) {
        view32[i] = colorWord;
        view32[i + 1] = 0x00000000;
      }
    }
    return buf;
  }

  // 6. BC7 (BPTC) Dominant Color Extractor & Mode 6 Solid Generator
  function extractBc7Color(data) {
    if (!data || data.byteLength < 16) return [180, 170, 150];
    const numBlocks = Math.floor(data.byteLength / 16);
    const step = Math.max(1, Math.floor(numBlocks / 128));
    let totalR = 0, totalG = 0, totalB = 0, count = 0;
    const view32 = new Uint32Array(data.buffer, data.byteOffset, data.byteLength >> 2);

    for (let i = 0; i < numBlocks; i += step) {
      const idx = i * 4;
      const w0 = view32[idx];
      const w1 = view32[idx + 1];
      if ((w0 & 0x7F) === 0x40) { // Mode 6
        const r0 = (w0 >> 7) & 0x7F;
        const g0 = (w0 >> 21) & 0x7F;
        const b0 = (w1 >> 3) & 0x7F;
        totalR += r0 * 2;
        totalG += g0 * 2;
        totalB += b0 * 2;
        count++;
      } else {
        totalR += data[i * 16 + 1];
        totalG += data[i * 16 + 2];
        totalB += data[i * 16 + 3];
        count++;
      }
    }
    if (count === 0) return [180, 170, 150];
    return [Math.round(totalR / count), Math.round(totalG / count), Math.round(totalB / count)];
  }

  function createSolidBc7Buffer(r, g, b, byteLength) {
    const r7 = (r >> 1) & 0x7F;
    const g7 = (g >> 1) & 0x7F;
    const b7 = (b >> 1) & 0x7F;
    const a7 = 0x7F;

    const w0 = 0x40 | (r7 << 7) | (r7 << 14) | (g7 << 21) | ((g7 & 0x0F) << 28);
    const w1 = ((g7 >> 4) & 0x07) | (b7 << 3) | (b7 << 10) | (a7 << 17) | (a7 << 24) | (1 << 31);
    const w2 = 0x00000001;
    const w3 = 0x00000000;

    const buf = new Uint8Array(byteLength);
    const view32 = new Uint32Array(buf.buffer);
    for (let i = 0; i < view32.length; i += 4) {
      view32[i] = w0;
      view32[i + 1] = w1;
      view32[i + 2] = w2;
      view32[i + 3] = w3;
    }
    return buf;
  }

  // 7. Buffer Downscaler for Raw Pixel Arrays & Normal Map Flattening
  function downscaleBuffer(pixels, format) {
    if (!pixels || !pixels.byteLength || pixels.byteLength <= 16) return pixels;
    const isRgb = (format === 0x1907 || format === 6407);
    const bpp = isRgb ? 3 : 4;
    const len = pixels.byteLength;
    const numPixels = Math.floor(len / bpp);
    const step = Math.max(1, Math.floor(numPixels / 128));
    let tr = 0, tg = 0, tb = 0, count = 0;
    for (let i = 0; i < numPixels; i += step) {
      const idx = i * bpp;
      tr += pixels[idx];
      tg += pixels[idx + 1];
      tb += pixels[idx + 2];
      count++;
    }
    const avgR = count ? Math.round(tr / count) : 180;
    const avgG = count ? Math.round(tg / count) : 170;
    const avgB = count ? Math.round(tb / count) : 150;

    // Flatten normal maps to neutral flat normal (Nx=0, Ny=0, Nz=1)
    if (Math.abs(avgR - 128) < 30 && Math.abs(avgG - 128) < 30 && avgB > 170) {
      avgR = 128;
      avgG = 128;
      avgB = 255;
    }

    const solid = new Uint8Array(len);
    for (let i = 0; i < len; i += bpp) {
      solid[i] = avgR;
      solid[i + 1] = avgG;
      solid[i + 2] = avgB;
      if (bpp === 4) solid[i + 3] = 255;
    }
    return solid;
  }

  function createSolidCompressedArrayBuffer(data, depth, format) {
    if (!data || !data.byteLength) return data;
    const numLayers = Math.max(1, depth || 1);
    const layerSize = Math.floor(data.byteLength / numLayers);
    if (layerSize <= 0) return data;

    const result = new Uint8Array(data.byteLength);
    const isDxt = isDxtFormat(format);
    const isBc7 = isBc7Format(format);

    for (let d = 0; d < numLayers; d++) {
      const start = d * layerSize;
      const slice = new Uint8Array(data.buffer, data.byteOffset + start, layerSize);
      let solidLayer;
      if (isDxt) {
        const col = extractDxtColor(slice, format);
        solidLayer = createSolidDxtBuffer(col[0], col[1], col[2], format, layerSize);
      } else if (isBc7) {
        const col = extractBc7Color(slice);
        solidLayer = createSolidBc7Buffer(col[0], col[1], col[2], layerSize);
      } else {
        solidLayer = slice;
      }
      result.set(solidLayer, start);
    }
    return result;
  }

  function downscaleBuffer3D(pixels, depth, format) {
    if (!pixels || !pixels.byteLength) return pixels;
    const numLayers = Math.max(1, depth || 1);
    const layerSize = Math.floor(pixels.byteLength / numLayers);
    if (layerSize <= 0) return pixels;
    const result = new Uint8Array(pixels.byteLength);
    for (let d = 0; d < numLayers; d++) {
      const start = d * layerSize;
      const slice = new Uint8Array(pixels.buffer, pixels.byteOffset + start, layerSize);
      const solid = downscaleBuffer(slice, format);
      result.set(solid, start);
    }
    return result;
  }

  let lastCompressedColor = [180, 170, 150];

  // 8. Install WebGL Hooks
  function installHooks(proto) {
    if (!proto || Object.prototype.hasOwnProperty.call(proto, '_notexturesHooked')) return;
    proto._notexturesHooked = true;

    // 0) Block ASTC, ETC, PVRTC
    const ogGetExt = proto.getExtension;
    if (ogGetExt) {
      proto.getExtension = function(name) {
        if (localStorage.getItem('tactical_notextures') === '1') {
          if (typeof name === 'string') {
            const l = name.toLowerCase();
            if (l.includes('astc') || l.includes('etc') || l.includes('pvrtc')) {
              return null;
            }
          }
        }
        return ogGetExt.call(this, name);
      };
    }

    const ogGetSupportedExt = proto.getSupportedExtensions;
    if (ogGetSupportedExt) {
      proto.getSupportedExtensions = function() {
        const list = ogGetSupportedExt.call(this) || [];
        if (localStorage.getItem('tactical_notextures') === '1') {
          return list.filter(ext => {
            const l = ext.toLowerCase();
            return !l.includes('astc') && !l.includes('etc') && !l.includes('pvrtc');
          });
        }
        return list;
      };
    }

    // A) Standard TexImage2D Hook
    const ogTexImage2D = proto.texImage2D;
    if (ogTexImage2D) {
      proto.texImage2D = function(...args) {
        if (localStorage.getItem('tactical_notextures') === '1') {
          for (let i = 0; i < args.length; i++) {
            let a = args[i];
            if (a && (a instanceof HTMLImageElement || (typeof ImageBitmap !== 'undefined' && a instanceof ImageBitmap) || a instanceof HTMLCanvasElement || (typeof OffscreenCanvas !== 'undefined' && a instanceof OffscreenCanvas))) {
              if (!isSkybox(a)) {
                args[i] = downscaleSource(a);
              }
            } else if (a && (a instanceof Uint8Array || a instanceof Uint8ClampedArray)) {
              args[i] = downscaleBuffer(a, args[2] || args[6]);
            }
          }
        }
        return ogTexImage2D.apply(this, args);
      };
    }

    // B) Standard TexSubImage2D Hook
    const ogTexSubImage2D = proto.texSubImage2D;
    if (ogTexSubImage2D) {
      proto.texSubImage2D = function(...args) {
        if (localStorage.getItem('tactical_notextures') === '1') {
          for (let i = 0; i < args.length; i++) {
            let a = args[i];
            if (a && (a instanceof HTMLImageElement || (typeof ImageBitmap !== 'undefined' && a instanceof ImageBitmap) || a instanceof HTMLCanvasElement || (typeof OffscreenCanvas !== 'undefined' && a instanceof OffscreenCanvas))) {
              if (!isSkybox(a)) {
                args[i] = downscaleSource(a);
              }
            } else if (a && (a instanceof Uint8Array || a instanceof Uint8ClampedArray)) {
              args[i] = downscaleBuffer(a, args[6]);
            }
          }
        }
        return ogTexSubImage2D.apply(this, args);
      };
    }

    // C) CompressedTexImage2D Hook (Map Textures)
    const ogCompressedTex = proto.compressedTexImage2D;
    if (ogCompressedTex) {
      proto.compressedTexImage2D = function(target, level, internalformat, width, height, border, data, ...rest) {
        if (localStorage.getItem('tactical_notextures') === '1' && data && data.byteLength > 0) {
          if (isDxtFormat(internalformat)) {
            if (level === 0) lastCompressedColor = extractDxtColor(data, internalformat);
            const solid = createSolidDxtBuffer(lastCompressedColor[0], lastCompressedColor[1], lastCompressedColor[2], internalformat, data.byteLength);
            return ogCompressedTex.call(this, target, level, internalformat, width, height, border, solid, ...rest);
          }
          if (isBc7Format(internalformat)) {
            if (level === 0) lastCompressedColor = extractBc7Color(data);
            const solid = createSolidBc7Buffer(lastCompressedColor[0], lastCompressedColor[1], lastCompressedColor[2], data.byteLength);
            return ogCompressedTex.call(this, target, level, internalformat, width, height, border, solid, ...rest);
          }
        }
        return ogCompressedTex.call(this, target, level, internalformat, width, height, border, data, ...rest);
      };
    }

    // D) CompressedTexSubImage2D Hook (Map Textures via Immutable Storage)
    const ogCompressedTexSub = proto.compressedTexSubImage2D;
    if (ogCompressedTexSub) {
      proto.compressedTexSubImage2D = function(target, level, xoffset, yoffset, width, height, format, data, ...rest) {
        if (localStorage.getItem('tactical_notextures') === '1' && data && data.byteLength > 0) {
          if (isDxtFormat(format)) {
            if (level === 0) lastCompressedColor = extractDxtColor(data, format);
            const solid = createSolidDxtBuffer(lastCompressedColor[0], lastCompressedColor[1], lastCompressedColor[2], format, data.byteLength);
            return ogCompressedTexSub.call(this, target, level, xoffset, yoffset, width, height, format, solid, ...rest);
          }
          if (isBc7Format(format)) {
            if (level === 0) lastCompressedColor = extractBc7Color(data);
            const solid = createSolidBc7Buffer(lastCompressedColor[0], lastCompressedColor[1], lastCompressedColor[2], data.byteLength);
            return ogCompressedTexSub.call(this, target, level, xoffset, yoffset, width, height, format, solid, ...rest);
          }
        }
        return ogCompressedTexSub.call(this, target, level, xoffset, yoffset, width, height, format, data, ...rest);
      };
    }

    // E) 3D & 2D-Array Texture Hooks (CS2 Batch Map Textures: cs2MapArr, cs2NrmArr, cs2RghArr, etc.)
    const ogCompressedTex3D = proto.compressedTexImage3D;
    if (ogCompressedTex3D) {
      proto.compressedTexImage3D = function(target, level, internalformat, width, height, depth, border, data, ...rest) {
        if (localStorage.getItem('tactical_notextures') === '1' && data && data.byteLength > 0) {
          const solid = createSolidCompressedArrayBuffer(data, depth, internalformat);
          return ogCompressedTex3D.call(this, target, level, internalformat, width, height, depth, border, solid, ...rest);
        }
        return ogCompressedTex3D.call(this, target, level, internalformat, width, height, depth, border, data, ...rest);
      };
    }

    const ogCompressedTexSub3D = proto.compressedTexSubImage3D;
    if (ogCompressedTexSub3D) {
      proto.compressedTexSubImage3D = function(target, level, xoffset, yoffset, zoffset, width, height, depth, format, data, ...rest) {
        if (localStorage.getItem('tactical_notextures') === '1' && data && data.byteLength > 0) {
          const solid = createSolidCompressedArrayBuffer(data, depth, format);
          return ogCompressedTexSub3D.call(this, target, level, xoffset, yoffset, zoffset, width, height, depth, format, solid, ...rest);
        }
        return ogCompressedTexSub3D.call(this, target, level, xoffset, yoffset, zoffset, width, height, depth, format, data, ...rest);
      };
    }

    const ogTexImage3D = proto.texImage3D;
    if (ogTexImage3D) {
      proto.texImage3D = function(...args) {
        if (localStorage.getItem('tactical_notextures') === '1') {
          const pixels = args[9];
          const depth = args[5];
          const format = args[7];
          if (pixels && pixels.byteLength > 0) {
            args[9] = downscaleBuffer3D(pixels, depth, format);
          }
        }
        return ogTexImage3D.apply(this, args);
      };
    }

    const ogTexSubImage3D = proto.texSubImage3D;
    if (ogTexSubImage3D) {
      proto.texSubImage3D = function(...args) {
        if (localStorage.getItem('tactical_notextures') === '1') {
          const pixels = args[10];
          const depth = args[7];
          const format = args[8];
          if (pixels && pixels.byteLength > 0) {
            args[10] = downscaleBuffer3D(pixels, depth, format);
          }
        }
        return ogTexSubImage3D.apply(this, args);
      };
    }

    // F) Safe GenerateMipmap
    const ogGenMip = proto.generateMipmap;
    if (ogGenMip) {
      proto.generateMipmap = function(target) {
        try {
          return ogGenMip.call(this, target);
        } catch(e) {}
      };
    }
  }

  installHooks(WebGLRenderingContext.prototype);
  if (typeof WebGL2RenderingContext !== 'undefined') {
    installHooks(WebGL2RenderingContext.prototype);
  }
  if (typeof WebGLRenderingContextBase !== 'undefined') {
    installHooks(WebGLRenderingContextBase.prototype);
  }
