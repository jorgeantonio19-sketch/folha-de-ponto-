const semanas = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const mesesNome = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// CONTROLO GLOBAL DA APLICAÇÃO
const App = {
    trocarAba(aba) {
        document.getElementById('abaFolha').style.display = aba === 'folha' ? '' : 'none';
        document.getElementById('abaHistorico').style.display = aba === 'historico' ? '' : 'none';
        document.getElementById('abaCurriculo').style.display = aba === 'curriculo' ? '' : 'none';

        document.getElementById('btnAbaFolha').classList.toggle('ativa', aba === 'folha');
        document.getElementById('btnAbaHistorico').classList.toggle('ativa', aba === 'historico');
        document.getElementById('btnAbaCurriculo').classList.toggle('ativa', aba === 'curriculo');

        if (aba === 'historico') {
            const inputNome = document.getElementById('nomeFuncionario');
            if (inputNome.value.trim()) document.getElementById('histNome').value = inputNome.value.trim();
            HistoricoController.render();
        } else if (aba === 'curriculo') {
            CurriculoController.carregar();
        }
    }
};

// CONTROLO DA FOLHA MENSAL
const FolhaController = {
    tbody: null,
    inputMes: null,
    inputNome: null,

    init() {
        this.tbody = document.getElementById('corpo');
        this.inputMes = document.getElementById('mesReferencia');
        this.inputNome = document.getElementById('nomeFuncionario');

        this.inputMes.addEventListener('change', () => {
            const local = localStorage.getItem(this.getChave());
            this.gerarTabela(local ? JSON.parse(local) : null);
        });

        document.getElementById('btnPreencher').addEventListener('click', () => this.preencherPadrao());
        document.getElementById('btnSalvar').addEventListener('click', () => this.salvarManual());
        document.getElementById('btnLimpar').addEventListener('click', () => this.limpar());
        document.getElementById('btnExportarPDF').addEventListener('click', () => this.exportarPDF());

        this.gerarTabela(null);
    },

    getChave() {
        return 'fp_' + this.inputMes.value + '_' + (this.inputNome.value || '').toLowerCase().trim().replace(/\s+/g, '_');
    },

    gerarTabela(dadosSalvos) {
        this.tbody.innerHTML = '';
        const [ano, mes] = this.inputMes.value.split('-').map(Number);
        const total = new Date(ano, mes, 0).getDate();

        for (let d = 1; d <= total; d++) {
            const dsw = new Date(ano, mes - 1, d).getDay();
            const tr = document.createElement('tr');
            tr.dataset.dsw = dsw;
            tr.dataset.dia = d;
            if (dsw === 0) tr.classList.add('domingo');
            else if (dsw === 6) tr.classList.add('fim-semana');

            tr.innerHTML = `
                <td>${String(d).padStart(2, '0')}/${semanas[dsw]}</td>
                <td>
                    <select class="status" onchange="FolhaController.mudaStatus(this); FolhaController.atualizarPainel(); FolhaController.autoSalvar();">
                        <option value="trabalhado">Trabalhado</option>
                        <option value="justificado">Falta Just.</option>
                        <option value="feriado">Feriado</option>
                        <option value="feriado-trab">Feriado Trab.</option>
                    </select>
                </td>
                ${['e1', 's1', 'e2', 's2'].map(() => `<td><input type="time" class="hora" oninput="FolhaController.atualizarPainel(); FolhaController.autoSalvar();"></td>`).join('')}
            `;
            this.tbody.appendChild(tr);

            if (dadosSalvos && dadosSalvos[d]) {
                const s = dadosSalvos[d];
                const sel = tr.querySelector('.status');
                sel.value = s.status;
                this.mudaStatus(sel);
                const inps = tr.querySelectorAll('.hora');
                if (s.horas) s.horas.forEach((v, i) => { if (inps[i]) inps[i].value = v; });
            }
        }
        this.atualizarPainel();
    },

    mudaStatus(sel) {
        const tr = sel.closest('tr');
        tr.classList.remove('justificado', 'feriado', 'feriado-trab');
        const inputs = tr.querySelectorAll('.hora');
        if (sel.value === 'justificado' || sel.value === 'feriado') {
            tr.classList.add(sel.value);
            inputs.forEach(i => { i.disabled = true; i.value = ''; });
        } else {
            if (sel.value === 'feriado-trab') tr.classList.add('feriado-trab');
            inputs.forEach(i => i.disabled = false);
        }
    },

    atualizarPainel() {
        let trabalhadas = 0, esperadas = 0, dias = 0;
        this.tbody.querySelectorAll('tr').forEach(tr => {
            const sel = tr.querySelector('.status');
            if (!sel) return;
            const dsw = parseInt(tr.dataset.dsw);
            const inputs = tr.querySelectorAll('.hora');
            const status = sel.value;

            if (status === 'feriado' || status === 'justificado') return;

            const [e1, s1, e2, s2] = [...inputs].map(i => Utils.toMin(i.value));
            let h = 0;
            if (e1 && s1 && s1 > e1) h += (s1 - e1);
            if (e2 && s2 && s2 > e2) h += (s2 - e2);
            if (h > 0) { trabalhadas += h; dias++; }

            if (status === 'trabalhado') {
                if (dsw >= 1 && dsw <= 5) esperadas += 480;
                else if (dsw === 6) esperadas += 240;
            }
        });

        const saldo = trabalhadas - esperadas;
        document.getElementById('horasTrabalhadas').textContent = Utils.minToStr(trabalhadas);
        document.getElementById('horasEsperadas').textContent = Utils.minToStr(esperadas);
        document.getElementById('diasTrabalhados').textContent = dias;

        const elS = document.getElementById('horasSaldo');
        elS.textContent = (saldo >= 0 ? '+' : '') + Utils.minToStr(saldo);
        elS.className = 'valor' + (saldo < 0 ? ' negativo' : '');
    },

    salvar() {
        if (!this.inputNome.value.trim()) return;
        const d = {};
        this.tbody.querySelectorAll('tr').forEach(tr => {
            d[tr.dataset.dia] = { status: tr.querySelector('.status').value, horas: [...tr.querySelectorAll('.hora')].map(i => i.value) };
        });
        localStorage.setItem(this.getChave(), JSON.stringify(d));
        Utils.showToast('💾 Alterações guardadas!');
    },

    timer: null,
    autoSalvar() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.salvar(), 1500);
    },

    salvarManual() {
        if (!this.inputNome.value.trim()) {
            alert('Defina o nome do colaborador para poder guardar os dados.');
            return;
        }
        this.salvar();
    },

    preencherPadrao() {
        const ss = [document.getElementById('ssE1').value, document.getElementById('ssS1').value, document.getElementById('ssE2').value, document.getElementById('ssS2').value];
        const sab = [document.getElementById('sabE1').value, document.getElementById('sabS1').value, document.getElementById('sabE2').value, document.getElementById('sabS2').value];

        this.tbody.querySelectorAll('tr').forEach(tr => {
            const dsw = parseInt(tr.dataset.dsw);
            const sel = tr.querySelector('.status');
            if (!sel || sel.value !== 'trabalhado') return;

            const inps = tr.querySelectorAll('.hora');
            const vals = (dsw >= 1 && dsw <= 5) ? ss : (dsw === 6 ? sab : null);
            if (vals) vals.forEach((v, i) => { if (inps[i]) inps[i].value = v; });
        });
        this.atualizarPainel();
        this.autoSalvar();
    },

    limpar() {
        if (confirm('Deseja limpar todos os registos do mês atual?')) {
            this.tbody.querySelectorAll('input').forEach(i => i.value = '');
            this.tbody.querySelectorAll('.status').forEach(s => { s.value = 'trabalhado'; this.mudaStatus(s); });
            this.atualizarPainel();
        }
    },

    exportarPDF() {
        if (!this.inputNome.value.trim()) {
            alert('Por favor, introduza o nome do colaborador antes de gerar o PDF.');
            return;
        }

        const [ano, mes] = this.inputMes.value.split('-');
        const divPdf = document.createElement('div');
        divPdf.className = 'pdf-container';

        let tabelaHtml = '';
        let totalTrabalhadas = 0, totalDias = 0;

        this.tbody.querySelectorAll('tr').forEach(tr => {
            const diaStr = tr.querySelector('td:first-child').innerText;
            const status = tr.querySelector('.status').value;
            const inputs = tr.querySelectorAll('.hora');
            const dsw = parseInt(tr.dataset.dsw);

            let classeLinha = '';
            if (dsw === 6) classeLinha = 'pdf-fds';
            if (dsw === 0) classeLinha = 'pdf-dom';

            let c1 = inputs[0].value || '', c2 = inputs[1].value || '', c3 = inputs[2].value || '', c4 = inputs[3].value || '';

            if (status === 'feriado') { c1 = 'FERIADO'; c2 = '—'; c3 = '—'; c4 = '—'; }
            else if (status === 'justificado') { c1 = 'FALTA JUSTIFICADA'; c2 = '—'; c3 = '—'; c4 = '—'; }
            else {
                const [e1, s1, e2, s2] = [...inputs].map(i => Utils.toMin(i.value));
                let h = 0;
                if (e1 && s1 && s1 > e1) h += (s1 - e1);
                if (e2 && s2 && s2 > e2) h += (s2 - e2);
                if (h > 0) { totalTrabalhadas += h; totalDias++; }
            }

            tabelaHtml += `
                <tr class="${classeLinha}">
                    <td style="font-weight:bold;">${diaStr}</td>
                    <td colspan="${(status === 'feriado' || status === 'justificado') ? '4' : '1'}">${c1}</td>
                    ${(status !== 'feriado' && status !== 'justificado') ? `<td>${c2}</td><td>${c3}</td><td>${c4}</td>` : ''}
                </tr>
            `;
        });

        divPdf.innerHTML = `
            <div class="pdf-header">
                <h2>Folha de Ponto Mensal</h2>
                <div class="pdf-meta">
                    <span>Colaborador: ${this.inputNome.value.toUpperCase()}</span>
                    <span>Período: ${mesesNome[parseInt(mes) - 1]} de ${ano}</span>
                </div>
            </div>
            <table class="pdf-table">
                <thead>
                    <tr><th style="width:14%">Dia</th><th>Entrada 1</th><th>Saída 1</th><th>Entrada 2</th><th>Saída 2</th></tr>
                </thead>
                <tbody>${tabelaHtml}</tbody>
            </table>
            <div class="pdf-totais">
                <span>Dias Trabalhados: ${totalDias}</span>
                <span>Total de Horas: ${Utils.minToStr(totalTrabalhadas)}</span>
            </div>
        `;

        const opt = {
            margin: [8, 8, 8, 8],
            filename: `Folha_Ponto_${this.inputNome.value.trim().replace(/\s+/g, '_')}_${this.inputMes.value}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2.5, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(divPdf).save();
        Utils.showToast('📄 PDF gerado com sucesso!');
    }
};

// CONTROLO DO HISTÓRICO
const HistoricoController = {
    render() {
        const busca = document.getElementById('histNome').value.toLowerCase().trim().replace(/\s+/g, '_');
        const hCorpo = document.getElementById('histCorpo');
        hCorpo.innerHTML = '';
        let encontrou = false;
        let registos = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key.startsWith('fp_')) continue;
            if (busca && !key.includes(busca)) continue;

            const partes = key.split('_');
            const dataRef = partes[1];
            const dados = JSON.parse(localStorage.getItem(key));

            let total = 0;
            Object.values(dados).forEach(l => {
                if (l.status === 'feriado' || l.status === 'justificado') return;
                const [e1, s1, e2, s2] = l.horas.map(Utils.toMin);
                if (e1 && s1 && s1 > e1) total += (s1 - e1);
                if (e2 && s2 && s2 > e2) total += (s2 - e2);
            });

            registos.push({ key, dataRef, total });
        }

        registos.sort((a, b) => b.dataRef.localeCompare(a.dataRef));

        registos.forEach(reg => {
            encontrou = true;
            const [ano, mes] = reg.dataRef.split('-');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding-left:12px; font-weight:600;">${mesesNome[parseInt(mes) - 1]} / ${ano}</td>
                <td style="text-align:center; color:#34d399; font-weight:700;">${Utils.minToStr(reg.total)}</td>
                <td class="acoes-hist" style="padding-right:12px;">
                    <button class="btn-acao btn-azul" onclick="HistoricoController.editar('${reg.key}')" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-acao btn-red" onclick="HistoricoController.excluir('${reg.key}')" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            hCorpo.appendChild(tr);
        });

        document.getElementById('histVazio').style.display = encontrou ? 'none' : 'block';
    },

    editar(key) {
        const partes = key.split('_');
        FolhaController.inputMes.value = partes[1];
        const nomeRaw = partes.slice(2).join(' ');
        FolhaController.inputNome.value = nomeRaw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        FolhaController.gerarTabela(JSON.parse(localStorage.getItem(key)));
        App.trocarAba('folha');
        Utils.showToast('✏️ Registo carregado para edição.');
    },

    excluir(key) {
        if (confirm('Tem a certeza que deseja eliminar este registo de forma permanente?')) {
            localStorage.removeItem(key);
            this.render();
            Utils.showToast('🗑️ Registo eliminado com sucesso.');
        }
    },

    exportarExcel() {
        const wb = XLSX.utils.book_new();
        const dados = [['Mês / Ano', 'Total de Horas Trabalhadas']];

        let registosParaExcel = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key.startsWith('fp_')) continue;
            const busca = document.getElementById('histNome').value.toLowerCase().trim().replace(/\s+/g, '_');
            if (busca && !key.includes(busca)) continue;

            const partes = key.split('_');
            const dataRef = partes[1];
            const item = JSON.parse(localStorage.getItem(key));

            let total = 0;
            Object.values(item).forEach(l => {
                if (l.status === 'feriado' || l.status === 'justificado') return;
                const [e1, s1, e2, s2] = l.horas.map(Utils.toMin);
                if (e1 && s1 && s1 > e1) total += (s1 - e1);
                if (e2 && s2 && s2 > e2) total += (s2 - e2);
            });
            registosParaExcel.push({ dataRef, total });
        }

        registosParaExcel.sort((a, b) => b.dataRef.localeCompare(a.dataRef));
        registosParaExcel.forEach(reg => {
            const [ano, mes] = reg.dataRef.split('-');
            dados.push([`${mesesNome[parseInt(mes) - 1]} / ${ano}`, Utils.minToStr(reg.total)]);
        });

        const ws = XLSX.utils.aoa_to_sheet(dados);
        XLSX.utils.book_append_sheet(wb, ws, "Histórico Consolidado");
        XLSX.writeFile(wb, `Historico_Horas_${FolhaController.inputNome.value.trim() || 'Geral'}.xlsx`);
    }
};

// CONTROLO DO CURRÍCULO
const CurriculoController = {
    fotoBase64: '',

    sincronizarNome(val) {
        document.getElementById('cv_nome').value = val;
        document.getElementById('nomeFuncionario').value = val;
        document.getElementById('display-name').textContent = val ? val : "Nome do Colaborador";
    },

    carregarFoto(e) {
        const reader = new FileReader();
        reader.onload = () => {
            this.fotoBase64 = reader.result;
            const img = document.getElementById('profile-img');
            img.src = this.fotoBase64;
            img.style.display = 'block';
            document.getElementById('photo-text').style.display = 'none';
        };
        if (e.target.files[0]) {
            reader.readAsDataURL(e.target.files[0]);
        }
    },

    salvar(e) {
        e.preventDefault();
        const nome = document.getElementById('cv_nome').value.trim();
        if (!nome) return alert('Por favor, informe pelo menos o nome.');

        const dadosCv = new CurriculoModel(
            nome,
            document.getElementById('cv_nascimento').value,
            document.getElementById('cv_email').value,
            document.getElementById('cv_telefone').value,
            document.getElementById('cv_cargo').value,
            document.getElementById('cv_empresa').value,
            document.getElementById('cv_tarefas').value,
            document.getElementById('cv_escolaridade').value,
            document.getElementById('cv_instituicao').value,
            this.fotoBase64
        );

        localStorage.setItem('cv_' + nome.toLowerCase().replace(/\s+/g, '_'), JSON.stringify(dadosCv));
        Utils.showToast('🎓 Currículo guardado com sucesso!');
    },

    carregar() {
        const nome = document.getElementById('nomeFuncionario').value.trim();
        if (!nome) return;

        const raw = localStorage.getItem('cv_' + nome.toLowerCase().replace(/\s+/g, '_'));
        if (raw) {
            const cv = JSON.parse(raw);
            document.getElementById('cv_nome').value = cv.nome;
            document.getElementById('cv_nascimento').value = cv.dataNascimento;
            document.getElementById('cv_email').value = cv.email;
            document.getElementById('cv_telefone').value = cv.telefone;
            document.getElementById('cv_cargo').value = cv.cargo;
            document.getElementById('cv_empresa').value = cv.empresa;
            document.getElementById('cv_tarefas').value = cv.tarefas;
            document.getElementById('cv_escolaridade').value = cv.escolaridade;
            document.getElementById('cv_instituicao').value = cv.instituicao;

            if (cv.fotoBase64) {
                this.fotoBase64 = cv.fotoBase64;
                const img = document.getElementById('profile-img');
                img.src = cv.fotoBase64;
                img.style.display = 'block';
                document.getElementById('photo-text').style.display = 'none';
            }
            this.sincronizarNome(cv.nome);
        }
    }
};

// INICIALIZAÇÃO DA APLICAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    FolhaController.init();
});
