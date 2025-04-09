// --- START OF FILE script.js ---

document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const h_eVs = 4.135667696e-15; // Planck constant in eV*s
    const h_Js = 6.62607015e-34;  // Planck constant in J*s
    const c = 299792458;         // Speed of light in m/s
    const eV_to_J = 1.602176634e-19; // Conversion factor
    const svgNS = "http://www.w3.org/2000/svg";
    const rainbowColors = ['violet', '#4b0082', 'blue', 'green', 'yellow', 'orange', 'red']; // Indigo hex

    // --- Helper Function to Create SVG Elements ---
    function createSvgElement(name, attributes) {
        const el = document.createElementNS(svgNS, name);
        for (const key in attributes) {
            el.setAttribute(key, attributes[key]);
        }
        return el;
    }

    // --- Function to map Wavelength to x-coordinate ---
    function wavelengthToX(lambda_nm, width, minLambda = 380, maxLambda = 760) {
        if (lambda_nm < minLambda || lambda_nm > maxLambda) return null;
        const range = maxLambda - minLambda;
        return ((lambda_nm - minLambda) / range) * width;
    }

    // ===========================================
    // --- Introduction Question Logic START ---
    // ===========================================
    const checkIntroBtn = document.getElementById('check-intro-answer');
    const introFeedbackDiv = document.getElementById('intro-feedback');

    if (checkIntroBtn && introFeedbackDiv) {
        checkIntroBtn.addEventListener('click', () => {
            const selectedAnswer = document.querySelector('input[name="rainbow-reason"]:checked');
            let feedbackHTML = '';
            introFeedbackDiv.className = 'feedback-box'; // Reset classes

            if (!selectedAnswer) {
                feedbackHTML = '<p>Vui lòng chọn một câu trả lời.</p>';
                introFeedbackDiv.classList.add('incorrect-feedback');
            } else {
                const answerValue = selectedAnswer.value;
                if (answerValue === 'correct') {
                    feedbackHTML = `<p>Chính xác!</p><span>Ánh sáng mặt trời bị khúc xạ (bẻ cong) khi đi vào giọt nước, sau đó phản xạ bên trong và khúc xạ lần nữa khi đi ra. Quan trọng hơn, vì chiết suất của nước đối với các màu khác nhau là khác nhau (hiện tượng tán sắc), nên các màu bị bẻ cong ở các góc hơi khác nhau, làm ánh sáng trắng tách thành dải 7 màu quen thuộc của cầu vồng.</span>`;
                    introFeedbackDiv.classList.add('correct-feedback');
                } else {
                    feedbackHTML = `<p>Chưa đúng.</p><span>Hiện tượng cầu vồng chủ yếu là do sự **khúc xạ** và **tán sắc** ánh sáng mặt trời khi nó đi qua các giọt nước mưa. Phản xạ bên trong giọt nước cũng đóng vai trò hướng các tia sáng đã tán sắc về phía người quan sát.</span>`;
                    introFeedbackDiv.classList.add('incorrect-feedback');
                }
            }
            introFeedbackDiv.innerHTML = feedbackHTML;
            introFeedbackDiv.style.display = 'block';
        });
    } else {
        console.warn("Required elements for introduction question not found.");
    }
    // ===========================================
    // --- Introduction Question Logic END ---
    // ===========================================


    // ========================================================
    // --- Interactive Prism Code START ---
    // ========================================================
    const interactivePrismSVG = document.getElementById('interactive-prism-diagram'); // Use specific variable name
    if (interactivePrismSVG) {
        const n_air_prism = 1.0; // Use specific variable names
        const prismColor_prism = 'lightblue';
        const prismStroke_prism = '#333';
        const spectrumData_prism = [
            { name: 'red', n: 1.510, color: 'red', pathElement: null }, { name: 'orange', n: 1.514, color: 'orange', pathElement: null },
            { name: 'yellow', n: 1.517, color: 'yellow', pathElement: null }, { name: 'green', n: 1.520, color: 'lime', pathElement: null },
            { name: 'blue', n: 1.524, color: 'blue', pathElement: null }, { name: 'indigo', n: 1.527, color: 'indigo', pathElement: null },
            { name: 'violet', n: 1.530, color: 'violet', pathElement: null }
        ];
        let prismState = { x: 250, y: 175, rotation: 0, size: 100, vertices: [] };
        let interactionState_prism = { isDragging: false, dragStartX: 0, dragStartY: 0, prismStartX: 0, prismStartY: 0 };
        let prismElement = null;
        let incidentPath_prism = null; // Use specific name

        const Vec_prism = { /* ... Vec Math Helpers needed ONLY by prism ... */
             create: (x, y) => ({ x, y }), add: (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
             sub: (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y }), scale: (v, s) => ({ x: v.x * s, y: v.y * s }),
             magnitude: (v) => Math.sqrt(v.x*v.x + v.y*v.y), normalize: (v) => { const m=Vec_prism.magnitude(v); return m===0?Vec_prism.create(0,0):Vec_prism.scale(v,1/m); },
             dot: (v1, v2) => v1.x * v2.x + v1.y * v2.y, rotate: (v, a) => ({x:v.x*Math.cos(a)-v.y*Math.sin(a), y:v.x*Math.sin(a)+v.y*Math.cos(a)}),
             normal: (p1, p2) => { const d = Vec_prism.normalize(Vec_prism.sub(p2, p1)); return Vec_prism.create(-d.y, d.x); }
        };

        function findIntersection_prism(p1, p2, p3, p4) { /* ... findIntersection logic needed ONLY by prism ... */
            const x1=p1.x, y1=p1.y, x2=p2.x, y2=p2.y, x3=p3.x, y3=p3.y, x4=p4.x, y4=p4.y; const den=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4); if(den===0) return null;
            const t=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/den; const u=-((x1-x2)*(y1-y3)-(y1-y2)*(x1-x3))/den;
            if(t>=0 && t<=1 && u>=0 && u<=1){ return Vec_prism.create(x1+t*(x2-x1), y1+t*(y2-y1)); } return null;
        }

        function calculateRefraction_prism(incidentDir, surfaceNormal, n1, n2) { /* ... calculateRefraction logic needed ONLY by prism ... */
             const incN=Vec_prism.normalize(incidentDir); const normN=Vec_prism.normalize(surfaceNormal); const corN=Vec_prism.dot(normN,incN)>0?Vec_prism.scale(normN,-1):normN;
             const cos1=-Vec_prism.dot(corN, incN); if(cos1<0 || cos1>1) return null; const sin1=Math.sqrt(1-cos1*cos1); const sin2=(n1/n2)*sin1; if(sin2>=1 || sin2<-1) return null;
             const cos2=Math.sqrt(1-sin2*sin2); const t1=Vec_prism.scale(incN, n1/n2); const t2=Vec_prism.scale(corN, (n1/n2)*cos1-cos2); return Vec_prism.normalize(Vec_prism.add(t1, t2));
         }

        function calculatePrismVertices() { /* ... calculatePrismVertices logic ... */
             const c=Vec_prism.create(prismState.x, prismState.y); const hS=prismState.size/2; const h=hS*Math.sqrt(3);
             const tr=Vec_prism.create(0, -h*2/3); const bl=Vec_prism.create(-hS, h*1/3); const br=Vec_prism.create(hS, h*1/3);
             const aR=prismState.rotation*Math.PI/180; const tR=Vec_prism.rotate(tr,aR); const blR=Vec_prism.rotate(bl,aR); const brR=Vec_prism.rotate(br,aR);
             prismState.vertices = [Vec_prism.add(c, tR), Vec_prism.add(c, blR), Vec_prism.add(c, brR)];
         }

        function createOrUpdatePrismElement(id, type, attributes, parent = interactivePrismSVG) { /* ... createOrUpdateElement logic (specific to prism context if needed) ... */
            let element = parent.querySelector(`#${id}`); // More robust selector
             if (!element) {
                 element = document.createElementNS(svgNS, type); element.setAttribute('id', id);
                 if (type === 'path' && prismElement) { parent.insertBefore(element, prismElement); }
                 else { parent.appendChild(element); }
             }
             for (const key in attributes) { element.setAttribute(key, attributes[key]); }
             return element;
        }

        function updatePrismDiagram() { /* ... updateDiagram logic for prism ... */
            if (!prismElement) return; calculatePrismVertices(); const pts=prismState.vertices.map(v=>`${v.x},${v.y}`).join(' '); prismElement.setAttribute('points',pts); if(!incidentPath_prism) return;
            const rS=Vec_prism.create(10, interactivePrismSVG.height.baseVal.value/2); const aP=Vec_prism.add(prismState.vertices[0], Vec_prism.scale(Vec_prism.sub(prismState.vertices[1], prismState.vertices[0]), 0.5)); const iDir=Vec_prism.normalize(Vec_prism.sub(aP, rS));
            let eP=null, eFN=null, eFI=-1, mED=Infinity;
            for(let i=0;i<3;i++){const p1=prismState.vertices[i],p2=prismState.vertices[(i+1)%3];const isect=findIntersection_prism(rS,Vec_prism.add(rS,Vec_prism.scale(iDir,1000)),p1,p2); if(isect){const d=Vec_prism.magnitude(Vec_prism.sub(isect,rS)); if(d>1e-6 && d<mED){mED=d;eP=isect;eFN=Vec_prism.normal(p1,p2);eFI=i;}}}
            if(eP){incidentPath_prism.setAttribute('d',`M ${rS.x} ${rS.y} L ${eP.x} ${eP.y}`);} else {incidentPath_prism.setAttribute('d',`M ${rS.x} ${rS.y}`); spectrumData_prism.forEach(cd=>{if(cd.pathElement) cd.pathElement.setAttribute('d','');}); return;}
            function traceInternalPath_prism(sP, dir, fIS){let xP=null,xFN=null,mXD=Infinity; for(let i=0;i<3;i++){if(i===fIS)continue; const p1=prismState.vertices[i],p2=prismState.vertices[(i+1)%3]; const oS=Vec_prism.add(sP,Vec_prism.scale(dir,1e-5)); const isect=findIntersection_prism(oS,Vec_prism.add(oS,Vec_prism.scale(dir,1000)),p1,p2); if(isect){const d=Vec_prism.magnitude(Vec_prism.sub(isect,sP)); if(d>1e-6 && d<mXD){mXD=d;xP=isect;xFN=Vec_prism.normal(p1,p2);}}} return {exitPoint:xP,exitFaceNormal:xFN};}
            spectrumData_prism.forEach(cd=>{if(!cd.pathElement) return; const intDir=calculateRefraction_prism(iDir,eFN,n_air_prism,cd.n); if(!intDir){cd.pathElement.setAttribute('d',''); return;} const exitInfo=traceInternalPath_prism(eP,intDir,eFI); if(!exitInfo.exitPoint){cd.pathElement.setAttribute('d',''); return;} const finDir=calculateRefraction_prism(intDir,exitInfo.exitFaceNormal,cd.n,n_air_prism); let d=`M ${eP.x} ${eP.y} L ${exitInfo.exitPoint.x} ${exitInfo.exitPoint.y}`; if(finDir){const endP=Vec_prism.add(exitInfo.exitPoint,Vec_prism.scale(finDir,1000)); d+=` L ${endP.x} ${endP.y}`;} cd.pathElement.setAttribute('d',d);});
        }

        function onPrismMouseDown(event) { /* ... onMouseDown logic ... */
            if(event.target===prismElement){interactionState_prism.isDragging=true;const pt=getPrismSVGPoint(event);interactionState_prism.dragStartX=pt.x;interactionState_prism.dragStartY=pt.y;interactionState_prism.prismStartX=prismState.x;interactionState_prism.prismStartY=prismState.y;prismElement.style.cursor='grabbing';interactivePrismSVG.classList.add('dragging');}
        }
        function onPrismMouseMove(event) { /* ... onMouseMove logic ... */
            if(interactionState_prism.isDragging){event.preventDefault();const pt=getPrismSVGPoint(event);const dx=pt.x-interactionState_prism.dragStartX;const dy=pt.y-interactionState_prism.dragStartY;prismState.x=interactionState_prism.prismStartX+dx;prismState.y=interactionState_prism.prismStartY+dy;if(event.shiftKey){} requestAnimationFrame(updatePrismDiagram);}
        }
        function onPrismMouseUp(event) { /* ... onMouseUp logic ... */
            if(interactionState_prism.isDragging){interactionState_prism.isDragging=false;prismElement.style.cursor='grab';interactivePrismSVG.classList.remove('dragging');}
        }
        function getPrismSVGPoint(event) { /* ... getSVGPoint logic ... */
             const pt=interactivePrismSVG.createSVGPoint();if(event.touches){if(event.touches.length>0){pt.x=event.touches[0].clientX;pt.y=event.touches[0].clientY;}else{return{x:0,y:0};}}else{pt.x=event.clientX;pt.y=event.clientY;} try{const CTM=interactivePrismSVG.getScreenCTM();return CTM?pt.matrixTransform(CTM.inverse()):{x:0,y:0};}catch(e){console.error("Prism CTM Error:",e);return{x:0,y:0};}
         }

        function initInteractivePrism() { /* ... initInteractivePrism logic ... */
             incidentPath_prism=createOrUpdatePrismElement('prism-incident-path','path',{class:'light-path incident-light',stroke:'#888'}); spectrumData_prism.forEach(cd=>{cd.pathElement=createOrUpdatePrismElement(`prism-path-${cd.name}`,'path',{class:`light-path path-${cd.name}`,stroke:cd.color});}); prismElement=createOrUpdatePrismElement('prism-poly','polygon',{fill:prismColor_prism,stroke:prismStroke_prism,'stroke-width':1}); updatePrismDiagram();
             interactivePrismSVG.addEventListener('mousedown',onPrismMouseDown);interactivePrismSVG.addEventListener('mousemove',onPrismMouseMove);interactivePrismSVG.addEventListener('mouseup',onPrismMouseUp);interactivePrismSVG.addEventListener('mouseleave',onPrismMouseUp);interactivePrismSVG.addEventListener('touchstart',onPrismMouseDown,{passive:false});interactivePrismSVG.addEventListener('touchmove',onPrismMouseMove,{passive:false});interactivePrismSVG.addEventListener('touchend',onPrismMouseUp);interactivePrismSVG.addEventListener('touchcancel',onPrismMouseUp); console.log("Interactive prism initialized.");
         }
        initInteractivePrism(); // Call the init function for the prism

    } // End of check for interactivePrismSVG element
    // ======================================================
    // --- Interactive Prism Code END ---
    // ======================================================


    // ======================================================
    // --- Draw Hydrogen Energy Levels START (Fig 11.4) -----
    // ======================================================
    function drawHydrogenLevels() {
        const svg = document.getElementById('hydrogen-levels-diagram');
        if (!svg) { console.warn("Hydrogen levels SVG not found."); return; } // Added check
        svg.innerHTML = '';

        // Check if width/height are available, provide defaults if not
        const width = svg.width?.baseVal?.value || 250;
        const height = svg.height?.baseVal?.value || 550;
        const padding = 50;
        const textPadding = 5;
        const levels = [ { name: 'K', n: 1, energy: -13.60 }, { name: 'L', n: 2, energy: -3.40 }, { name: 'M', n: 3, energy: -1.51 }, { name: 'N', n: 4, energy: -0.85 }, { name: 'O', n: 5, energy: -0.54 }, { name: 'P', n: 6, energy: -0.38 }, { name: 'Ionization', n: Infinity, energy: 0 } ];
        const minEnergy = -14; const maxEnergy = 1; const energyRange = maxEnergy - minEnergy;
        function energyToY(energy) { return height - padding - ((energy - minEnergy) / energyRange) * (height - 2 * padding); }
        let selectedLevel1 = null; let selectedLevel2 = null;
        const selectedLevelsSpan = document.getElementById('selected-levels');
        const photonResultSpan = document.getElementById('photon-result');
        const resetButton = document.getElementById('reset-levels');

        function updateSelectionText() { if(selectedLevelsSpan) selectedLevelsSpan.textContent = `Mức 1: ${selectedLevel1?selectedLevel1.name:'?'}, Mức 2: ${selectedLevel2?selectedLevel2.name:'?'}`; if(photonResultSpan) photonResultSpan.textContent = 'Photon: ? eV, ? nm'; }
        function calculatePhoton() { if(selectedLevel1&&selectedLevel2&&photonResultSpan){const E1=selectedLevel1.energy;const E2=selectedLevel2.energy;const dE=Math.abs(E1-E2);if(dE===0){photonResultSpan.textContent='Photon: 0 eV (No transition)';return;} const l_m=(h_eVs*c)/dE; const l_nm=l_m*1e9; photonResultSpan.textContent=`Photon: ${dE.toFixed(2)} eV, ${l_nm.toFixed(1)} nm`;}else if(photonResultSpan){photonResultSpan.textContent='Photon: ? eV, ? nm';}}

        levels.forEach(level => {
            const y = energyToY(level.energy);
            const line = createSvgElement('line', { x1: padding, y1: y, x2: width - padding, y2: y, class: 'energy-level', 'data-level-name': level.name, 'data-level-energy': level.energy });
            const energyText = createSvgElement('text', { x: padding - textPadding, y: y + 4, class: 'energy-value' }); energyText.textContent = level.energy.toFixed(2);
            const labelText = createSvgElement('text', { x: width - padding + textPadding, y: y + 4, class: 'level-label' }); labelText.textContent = level.name;
            line.addEventListener('click', () => {
                if(selectedLevel1&&selectedLevel1.name===level.name){selectedLevel1=null;line.classList.remove('selected');}else if(selectedLevel2&&selectedLevel2.name===level.name){selectedLevel2=null;line.classList.remove('selected');}else if(!selectedLevel1){selectedLevel1=level;line.classList.add('selected');}else if(!selectedLevel2){selectedLevel2=level;line.classList.add('selected');}else{const oldL=svg.querySelector(`.energy-level[data-level-name="${selectedLevel1.name}"]`);if(oldL)oldL.classList.remove('selected');selectedLevel1=level;line.classList.add('selected');} updateSelectionText();calculatePhoton();
            });
            svg.appendChild(line); svg.appendChild(energyText); svg.appendChild(labelText);
        });
         if (resetButton) { resetButton.addEventListener('click', () => { selectedLevel1=null; selectedLevel2=null; svg.querySelectorAll('.energy-level.selected').forEach(el=>el.classList.remove('selected')); updateSelectionText(); calculatePhoton(); }); }
         else { console.warn("Reset button 'reset-levels' not found."); }
    }
    // ======================================================
    // --- Draw Hydrogen Energy Levels END (Fig 11.4) -----
    // ======================================================


    // ======================================================
    // --- Draw Spectrum START (Emission/Absorption) ------
    // ======================================================
    // Generic function to draw line spectra (used by Emission/Absorption)
    function drawLineSpectrum(svgElementId, isEmission, lineData) {
        const svg = document.getElementById(svgElementId);
        if (!svg) { console.warn(`Spectrum SVG #${svgElementId} not found.`); return; }
        svg.innerHTML = ''; // Clear

        const width = svg.width?.baseVal?.value || 400; // Default width
        const height = svg.height?.baseVal?.value || 50; // Default height
        const labelYOffset = 15;

        // Background
        if (isEmission) {
            const bg = createSvgElement('rect', { x: 0, y: 0, width: width, height: height, fill: 'black', class: 'spectrum-bg' });
            svg.appendChild(bg);
        } else { // Absorption: gradient background
            const gradientId = `grad-${svgElementId}`;
            const defs = createSvgElement('defs');
            const linearGradient = createSvgElement('linearGradient', { id: gradientId, x1: "0%", y1: "0%", x2: "100%", y2: "0%" });
            rainbowColors.forEach((color, index) => { const offset = (index / (rainbowColors.length - 1)) * 100; const stop = createSvgElement('stop', { offset: `${offset}%`, 'stop-color': color }); linearGradient.appendChild(stop); });
            defs.appendChild(linearGradient); svg.appendChild(defs);
            const bg = createSvgElement('rect', { x: 0, y: 0, width: width, height: height, fill: `url(#${gradientId})`, class: 'spectrum-bg-gradient' });
            svg.appendChild(bg);
        }

        // Draw Lines
        lineData.forEach(item => {
            const lambda = isEmission ? item.lambda : item; // Get wavelength
            const x = wavelengthToX(lambda, width);
            if (x !== null) {
                const specLine = createSvgElement('line', {
                    x1: x, y1: 0, x2: x, y2: height - labelYOffset,
                    stroke: isEmission ? item.color : 'black', // Color for emission, black for absorption
                    class: isEmission ? 'emission-line' : 'absorption-line'
                });
                svg.appendChild(specLine);

                // Add label (optional, can get crowded)
                const label = createSvgElement('text', { x: x, y: height - labelYOffset + 10, class: 'line-label' });
                label.textContent = `${lambda.toFixed(0)}`;
                svg.appendChild(label);
            }
        });
    }

    // Define H line data
    const hydrogenEmissionLines = [ { lambda: 656.3, color: 'red' }, { lambda: 486.1, color: 'cyan' }, { lambda: 434.0, color: 'blue' }, { lambda: 410.2, color: 'violet' } ];
    const hydrogenAbsorptionLines = [ 656.3, 486.1, 434.0, 410.2 ];

    // Wrapper functions to call the generic drawer
    function drawEmissionSpectrum() { drawLineSpectrum('emission-spectrum-diagram', true, hydrogenEmissionLines); }
    function drawAbsorptionSpectrum() { drawLineSpectrum('absorption-spectrum-diagram', false, hydrogenAbsorptionLines); }
    // ======================================================
    // --- Draw Spectrum END (Emission/Absorption) --------
    // ======================================================


    // ===========================================
    // --- Stellar Spectra Simulation START ---
    // ===========================================
    const starFieldSVG = document.getElementById('star-field-svg');
    const selectedStarSpectrumSVG = document.getElementById('selected-star-spectrum-svg');
    const referenceSpectraListDiv = document.getElementById('reference-spectra-list');

    if (starFieldSVG && selectedStarSpectrumSVG && referenceSpectraListDiv) { // Ensure all elements exist

        const elementSpectra = { // Simplified absorption lines (nm)
            'Hydrogen': [410.2, 434.0, 486.1, 656.3], 'Helium': [388.9, 402.6, 447.1, 501.6, 587.6, 667.8, 706.5],
            'Sodium': [589.0, 589.6], 'Calcium': [393.4, 396.8, 422.7], 'Iron': [386.0, 404.6, 438.4, 440.5, 495.8, 527.0], 'Magnesium': [383.8, 516.7, 517.3, 518.4]
        };
        const starsData = [ // Fictional stars
            { id: 1, x: 50, y: 50, color: 'lightblue', elements: ['Hydrogen', 'Helium'] }, { id: 2, x: 300, y: 150, color: 'orange', elements: ['Hydrogen', 'Helium', 'Iron'] },
            { id: 3, x: 70, y: 150, color: '#add8e6', elements: ['Hydrogen', 'Helium', 'Calcium'] }, { id: 4, x: 200, y: 80, color: 'white', elements: ['Hydrogen', 'Calcium', 'Magnesium'] },
            { id: 5, x: 150, y: 250, color: 'yellow', elements: ['Hydrogen', 'Sodium', 'Iron'] }, { id: 6, x: 220, y: 120, color: 'red', elements: ['Hydrogen', 'Iron', 'Magnesium'] },
            { id: 7, x: 80, y: 300, color: '#90ee90', elements: ['Helium', 'Magnesium'] }, { id: 8, x: 320, y: 60, color: 'gold', elements: ['Hydrogen', 'Helium', 'Sodium', 'Calcium'] },
            { id: 9, x: 250, y: 280, color: '#eee', elements: ['Hydrogen', 'Helium', 'Calcium', 'Iron'] }, { id: 10, x: 350, y: 320, color: 'yellow', elements: ['Sodium', 'Iron', 'Calcium'] }
        ];
        let selectedStar = null;

        // --- Helper to Draw a Spectrum (Specific to Stellar Sim - Absorption only) ---
        function drawStellarSpectrum(svgElement, linesToShow = [], width = 300, height = 30) {
            if (!svgElement) return; svgElement.innerHTML = '';
            const defs = createSvgElement('defs'); const gradId = `grad-${svgElement.id||'stellar'}-${Math.random().toString(16).slice(2)}`;
            const linearGradient = createSvgElement('linearGradient', { id: gradId, x1: "0%", y1: "0%", x2: "100%", y2: "0%" });
            rainbowColors.forEach((c, i) => { const off=(i/(rainbowColors.length-1))*100; linearGradient.appendChild(createSvgElement('stop', { offset: `${off}%`, 'stop-color': c })); });
            defs.appendChild(linearGradient); svgElement.appendChild(defs);
            const bg = createSvgElement('rect', { x:0, y:0, width:width, height:height, fill:`url(#${gradId})` }); svgElement.appendChild(bg);
            linesToShow.forEach(lambda => { const x = wavelengthToX(lambda, width); if (x!==null) { svgElement.appendChild(createSvgElement('line', { x1: x, y1: 0, x2: x, y2: height, class: 'abs-line' })); } });
        }

        function updateSelectedStarSpectrum() { // Updates the bottom spectrum display
            if (!selectedStar || !selectedStarSpectrumSVG) { drawStellarSpectrum(selectedStarSpectrumSVG, [], selectedStarSpectrumSVG.width?.baseVal?.value || 380, selectedStarSpectrumSVG.height?.baseVal?.value || 40); return; }
            let combinedLines = []; selectedStar.elements.forEach(elName => { if (elementSpectra[elName]) { combinedLines = combinedLines.concat(elementSpectra[elName]); } });
            const uniqueLines = [...new Set(combinedLines)].sort((a,b)=>a-b);
            drawStellarSpectrum(selectedStarSpectrumSVG, uniqueLines, selectedStarSpectrumSVG.width?.baseVal?.value || 380, selectedStarSpectrumSVG.height?.baseVal?.value || 40);
        }

        function initStellarSimulation() { // Creates stars and reference spectra
            starsData.forEach(star => { // Create stars
                const starCircle = createSvgElement('circle', { id:`star-${star.id}`, cx:star.x, cy:star.y, r:5, fill:star.color, class:'star' });
                const starLabel = createSvgElement('text', { x:star.x, y:star.y+15, class:'star-label' }); starLabel.textContent = star.id;
                starCircle.addEventListener('click', () => {
                    if (selectedStar) { const prev = starFieldSVG.querySelector(`#star-${selectedStar.id}`); if(prev) prev.classList.remove('selected'); }
                    selectedStar = star; starCircle.classList.add('selected'); updateSelectedStarSpectrum();
                });
                starFieldSVG.appendChild(starCircle); starFieldSVG.appendChild(starLabel);
            });
            referenceSpectraListDiv.innerHTML = ''; // Create reference spectra
            for (const elName in elementSpectra) {
                const itemDiv = document.createElement('div'); itemDiv.className = 'reference-item';
                const label = document.createElement('label'); label.textContent = elName;
                const svg = createSvgElement('svg', { class:'reference-spectrum-svg', width:"300", height:"30" });
                itemDiv.appendChild(label); itemDiv.appendChild(svg); referenceSpectraListDiv.appendChild(itemDiv);
                drawStellarSpectrum(svg, elementSpectra[elName]); // Use stellar draw func
            }
            updateSelectedStarSpectrum(); // Initial empty draw for selected star
            console.log("Stellar simulation initialized.");
        }
        initStellarSimulation(); // Initialize this specific simulation

    } else { console.warn("Stellar Simulation elements not found!"); }
    // ===========================================
    // --- Stellar Spectra Simulation END ---
    // ===========================================


    // --- Event Listeners for OTHER Buttons etc. ---
    const convertBtn = document.getElementById('convert-ev-joule');
    const jouleAnswers = document.getElementById('joule-answers');
    if (convertBtn && jouleAnswers) { convertBtn.addEventListener('click', () => { jouleAnswers.style.display = jouleAnswers.style.display === 'none' ? 'block' : 'none'; }); }

    const calcExampleBtn = document.getElementById('calculate-example');
    const exampleResultP = document.getElementById('example-result');
    if (calcExampleBtn && exampleResultP) {
        calcExampleBtn.addEventListener('click', () => {
            const E3 = -1.51, E2 = -3.40, deltaE = E3 - E2; const energy_J = deltaE * eV_to_J;
            const lambda_m = (h_Js * c) / energy_J; const lambda_nm = lambda_m * 1e9;
            exampleResultP.textContent = `E = E3 - E2 = ${deltaE.toFixed(2)} eV. λ = hc/E = ${lambda_nm.toFixed(1)} nm (Red).`;
        });
    }

    // --- Toggle Answer Button Logic ---
    const toggleBtns = document.querySelectorAll('.toggle-answer-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const answerDiv = document.getElementById(targetId);
            if (answerDiv) {
                const isVisible = answerDiv.style.display === 'block';
                answerDiv.style.display = isVisible ? 'none' : 'block';
                btn.textContent = isVisible ? 'Hiện giải thích' : 'Ẩn giải thích';
            }
        });
    });

    // --- Initial Drawing Calls for OTHER diagrams ---
    // Ensure these are called *after* their respective logic blocks might define helper functions they need
    drawHydrogenLevels();
    drawEmissionSpectrum();
    drawAbsorptionSpectrum();

}); // End DOMContentLoaded

// --- END OF FILE script.js ---