import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Keyboard, Mic, MicOff, X } from 'lucide-react';

interface AudioVisualizerProps {
  audioUrl?: string;
  onClose?: () => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
  isListening?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  currentAudio?: HTMLAudioElement | null;
}
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioUrl,
  onClose,
  onStartListening,
  onStopListening,
  isListening = false,
  isProcessing = false,
  isSpeaking = false,
  currentAudio = null
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  useEffect(() => {
    if (!mountRef.current) return;

    // Get container dimensions
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const params = {
      red: 1.0,
      green: 1.0,
      blue: 1.0,
      threshold: 0.5,
      strength: 0.7,
      radius: 0.8
    };
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = params.threshold;
    bloomPass.strength = params.strength;
    bloomPass.radius = params.radius;
    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);
    const outputPass = new OutputPass();
    bloomComposer.addPass(outputPass);
    // Adjusted camera position to move visualizer up
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);
    const uniforms = {
      u_time: {
        type: 'f',
        value: 0.0
      },
      u_frequency: {
        type: 'f',
        value: 0.0
      },
      u_red: {
        type: 'f',
        value: 1.0
      },
      u_green: {
        type: 'f',
        value: 1.0
      },
      u_blue: {
        type: 'f',
        value: 1.0
      }
    };
    const vertexShader = `
        uniform float u_time;

        vec3 mod289(vec3 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        
        vec4 mod289(vec4 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        
        vec4 permute(vec4 x) {
          return mod289(((x*34.0)+10.0)*x);
        }
        
        vec4 taylorInvSqrt(vec4 r) {
          return 1.79284291400159 - 0.85373472095314 * r;
        }
        
        vec3 fade(vec3 t) {
          return t*t*t*(t*(t*6.0-15.0)+10.0);
        }

        float pnoise(vec3 P, vec3 rep) {
          vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
          vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
          Pi0 = mod289(Pi0);
          Pi1 = mod289(Pi1);
          vec3 Pf0 = fract(P); // Fractional part for interpolation
          vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
          vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
          vec4 iy = vec4(Pi0.yy, Pi1.yy);
          vec4 iz0 = Pi0.zzzz;
          vec4 iz1 = Pi1.zzzz;

          vec4 ixy = permute(permute(ix) + iy);
          vec4 ixy0 = permute(ixy + iz0);
          vec4 ixy1 = permute(ixy + iz1);

          vec4 gx0 = ixy0 * (1.0 / 7.0);
          vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
          gx0 = fract(gx0);
          vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
          vec4 sz0 = step(gz0, vec4(0.0));
          gx0 -= sz0 * (step(0.0, gx0) - 0.5);
          gy0 -= sz0 * (step(0.0, gy0) - 0.5);

          vec4 gx1 = ixy1 * (1.0 / 7.0);
          vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
          gx1 = fract(gx1);
          vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
          vec4 sz1 = step(gz1, vec4(0.0));
          gx1 -= sz1 * (step(0.0, gx1) - 0.5);
          gy1 -= sz1 * (step(0.0, gy1) - 0.5);

          vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
          vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
          vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
          vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
          vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
          vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
          vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
          vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

          vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
          g000 *= norm0.x;
          g010 *= norm0.y;
          g100 *= norm0.z;
          g110 *= norm0.w;
          vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
          g001 *= norm1.x;
          g011 *= norm1.y;
          g101 *= norm1.z;
          g111 *= norm1.w;

          float n000 = dot(g000, Pf0);
          float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
          float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
          float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
          float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
          float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
          float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
          float n111 = dot(g111, Pf1);

          vec3 fade_xyz = fade(Pf0);
          vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
          vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
          float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
          return 2.2 * n_xyz;
        }

        uniform float u_frequency;

        void main() {
            float noise = 3.0 * pnoise(position + u_time, vec3(10.0));
            float displacement = (u_frequency / 30.) * (noise / 10.);
            vec3 newPosition = position + normal * displacement;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
        `;
    const fragmentShader = `
        uniform float u_red;
        uniform float u_blue;
        uniform float u_green;
        void main() {
            gl_FragColor = vec4(vec3(u_red, u_green, u_blue), 1. );
        }
        `;
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader
    });

    // Responsive geometry size
    const baseSize = Math.min(width, height) < 768 ? 2.5 : 4;
    const geo = new THREE.IcosahedronGeometry(baseSize, 30);
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    mesh.material.wireframe = true;
    const listener = new THREE.AudioListener();
    camera.add(listener);
    let analyser: THREE.AudioAnalyser | null = null;
    let sound: THREE.Audio | null = null;
    let nativeAnalyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;

    // If audioUrl is provided, load the audio file
    if (audioUrl) {
      sound = new THREE.Audio(listener);
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load(audioUrl, function (buffer) {
        if (sound) {
          sound.setBuffer(buffer);
          setAudioLoaded(true);
        }
      });
      analyser = new THREE.AudioAnalyser(sound, 32);
    }
    
    // Initialize microphone when listening starts (separate from audio file loading)
    if (!audioUrl && isListening && !mediaStreamRef.current) {
      // Use microphone input with native Web Audio API only when listening
      navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      }).then(function (stream) {
        mediaStreamRef.current = stream;
        const audioContext = listener.context;
        const source = audioContext.createMediaStreamSource(stream);
        
        // Create native analyser
        nativeAnalyser = audioContext.createAnalyser();
        nativeAnalyser.fftSize = 64;
        nativeAnalyser.smoothingTimeConstant = 0.8;
        
        // Connect source to analyser
        source.connect(nativeAnalyser);
        
        // Create data array for frequency data
        dataArray = new Uint8Array(nativeAnalyser.frequencyBinCount);
        
        setAudioLoaded(true);
      }).catch(function (err) {
        console.error('Error accessing microphone:', err);
      });
    } else if (!audioUrl && !isListening && mediaStreamRef.current) {
      // Stop the media stream when not listening
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      nativeAnalyser = null;
      dataArray = null;
    }
    
  // Connect to audio element when speaking (AI response playback)
  if (!audioUrl && isSpeaking && currentAudio && !audioSourceRef.current) {
    try {
      // Create or reuse audio context
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Resume audio context if it's suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      // Create analyser for playback audio
      if (!audioAnalyserRef.current) {
        audioAnalyserRef.current = audioContextRef.current.createAnalyser();
        audioAnalyserRef.current.fftSize = 64;
        audioAnalyserRef.current.smoothingTimeConstant = 0.8;
      }
      
      // Check if the audio element already has a source connected
      // This prevents "The AudioContext was not allowed to start" error
      if (!(currentAudio as any)._audioSourceConnected) {
        // Create source from audio element
        audioSourceRef.current = audioContextRef.current.createMediaElementSource(currentAudio);
        audioSourceRef.current.connect(audioAnalyserRef.current);
        audioAnalyserRef.current.connect(audioContextRef.current.destination);
        
        // Mark audio element as having a connected source
        (currentAudio as any)._audioSourceConnected = true;
        
        console.log('Connected audio playback to visualizer');
      } else {
        console.log('Audio element already has a connected source');
      }
      
      // Use the same analyser variables for consistency
      nativeAnalyser = audioAnalyserRef.current;
      dataArray = new Uint8Array(audioAnalyserRef.current.frequencyBinCount);
      
    } catch (err) {
      console.error('Error connecting audio playback to visualizer:', err);
      // If connection fails, we can still provide a simple amplitude-based visualization
      console.log('Falling back to simulated visualization');
    }
  } else if (!isSpeaking && audioSourceRef.current) {
    // Don't disconnect the audio source completely as it can't be reconnected
    // Just clear our reference
    console.log('Audio playback stopped, clearing visualizer reference');
    if (!isListening) {
      nativeAnalyser = null;
      dataArray = null;
    }
  }

    // Click handler for playing audio (if audio file is loaded)
    const handleClick = () => {
      if (sound && audioLoaded && !isPlaying) {
        sound.play();
        setIsPlaying(true);
      }
    };
    if (audioUrl) {
      window.addEventListener('click', handleClick);
    }
    // GUI controls removed - no longer needed
    // Set default values directly
    uniforms.u_red.value = params.red;
    uniforms.u_green.value = params.green;
    uniforms.u_blue.value = params.blue;
    bloomPass.threshold = params.threshold;
    bloomPass.strength = params.strength;
    bloomPass.radius = params.radius;
    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', function (e) {
      let windowHalfX = window.innerWidth / 2;
      let windowHalfY = window.innerHeight / 2;
      mouseX = (e.clientX - windowHalfX) / 100;
      mouseY = (e.clientY - windowHalfY) / 100;
    });
    const clock = new THREE.Clock();
    function animate() {
      camera.position.x += (mouseX - camera.position.x) * .05;
      camera.position.y += (-mouseY - camera.position.y) * 0.5;
      camera.lookAt(scene.position);
      uniforms.u_time.value = clock.getElapsedTime();
      
      // Get frequency data
      if (analyser) {
        uniforms.u_frequency.value = analyser.getAverageFrequency();
      } else if (nativeAnalyser && dataArray) {
        // For microphone input or audio playback, use native analyser
        nativeAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        // Amplify the frequency value for better visualization
        const avgFrequency = sum / dataArray.length;
        uniforms.u_frequency.value = avgFrequency * (isSpeaking ? 1.5 : 1.0); // Boost when speaking
      } else if (isSpeaking) {
        // Fallback: Simulate audio visualization when speaking but can't access audio data
        // Create a pulsing effect that varies over time
        const time = clock.getElapsedTime();
        const baseFreq = 30 + Math.sin(time * 2) * 15; // Varies between 15-45
        const variation = Math.sin(time * 5) * 10 + Math.cos(time * 3) * 5; // Add some complexity
        uniforms.u_frequency.value = Math.max(0, baseFreq + variation);
      } else {
        uniforms.u_frequency.value = 0;
      }
      
      bloomComposer.render();
      requestAnimationFrame(animate);
    }
    animate();
    const handleResize = () => {
      if (!container || !container.parentElement) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      bloomComposer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      // Clean up
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (audioUrl) {
        window.removeEventListener('click', handleClick);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      // Stop media stream if it exists
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isListening, isSpeaking, currentAudio]);
  const handleMicToggle = () => {
    if (isListening) {
      if (onStopListening) {
        onStopListening();
      }
      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    } else {
      if (onStartListening) {
        onStartListening();
      }
    }
  };

  const handleKeyboardToggle = () => {
    setIsKeyboardMode(!isKeyboardMode);
    // Here you can add logic to enable/disable keyboard input mode
  };

  const handleClose = () => {
    // Stop any active media streams
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (onClose) {
      onClose();
    }
  };

  return <div className="relative w-full h-screen overflow-hidden">
            {/* Visualizer container - full height */}
            <div ref={mountRef} className="w-full h-full" />
            
            {audioUrl && !audioLoaded && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-lg">
                    Loading audio...
                </div>}
            {audioUrl && audioLoaded && !isPlaying && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-lg cursor-pointer bg-black/50 px-6 py-3 rounded-lg border border-white/20 hover:bg-black/70 transition-colors">
                    Click anywhere to play audio
                </div>}
            
            {/* Audio Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center justify-center gap-6">
                {/* Keyboard Button */}
                <button
                  onClick={handleKeyboardToggle}
                  className={`rounded-full h-12 w-12 flex items-center justify-center transition-all duration-300 ${
                    isKeyboardMode 
                      ? 'bg-white/90 text-gray-900 shadow-lg shadow-white/20' 
                      : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
                  }`}
                  title="Toggle Keyboard Input"
                >
                  <Keyboard className="w-5 h-5" />
                </button>

                {/* Main Microphone Button - Larger and centered */}
                <button
                  onClick={handleMicToggle}
                  disabled={isProcessing}
                  className={`rounded-full h-16 w-16 flex items-center justify-center transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500/80 hover:bg-red-600/80 text-white shadow-lg shadow-red-500/30 animate-pulse border border-red-400/50' 
                      : 'bg-white/90 hover:bg-white text-gray-900 shadow-lg border border-white/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isListening ? "Stop Listening" : "Start Listening"}
                >
                  {isListening ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="rounded-full h-12 w-12 flex items-center justify-center bg-white/20 text-white hover:bg-red-500/30 hover:text-red-300 transition-all duration-300 border border-white/20"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Indicators */}
              <div className="flex justify-center mt-4 gap-4 text-white/80 text-sm">
                {isProcessing && (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                    Processing...
                  </span>
                )}
                {isKeyboardMode && (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Keyboard input active
                  </span>
                )}
                {isListening && !isProcessing && (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Listening...
                  </span>
                )}
              </div>
            </div>
            
            {/* Audio Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center justify-center gap-6">
                {/* Keyboard Button */}
                <button
                  onClick={handleKeyboardToggle}
                  className={`rounded-full h-12 w-12 flex items-center justify-center transition-all duration-300 ${
                    isKeyboardMode 
                      ? 'bg-white/90 text-gray-900 shadow-lg shadow-white/20' 
                      : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
                  }`}
                  title="Toggle Keyboard Input"
                >
                  <Keyboard className="w-5 h-5" />
                </button>

                {/* Main Microphone Button - Larger and centered */}
                <button
                  onClick={handleMicToggle}
                  disabled={isProcessing}
                  className={`rounded-full h-16 w-16 flex items-center justify-center transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500/80 hover:bg-red-600/80 text-white shadow-lg shadow-red-500/30 animate-pulse border border-red-400/50' 
                      : 'bg-white/90 hover:bg-white text-gray-900 shadow-lg border border-white/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isListening ? "Stop Listening" : "Start Listening"}
                >
                  {isListening ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="rounded-full h-12 w-12 flex items-center justify-center bg-white/20 text-white hover:bg-red-500/30 hover:text-red-300 transition-all duration-300 border border-white/20"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Indicators */}
              <div className="flex justify-center mt-4 gap-4 text-white/80 text-sm">
                {isProcessing && (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                    Processing...
                  </span>
                )}
                {isKeyboardMode && (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Keyboard input active
                  </span>
                )}
                {isListening && !isProcessing && (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Listening...
                  </span>
                )}
              </div>
            </div>
        </div>;
};
export default AudioVisualizer;
