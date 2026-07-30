// CONTROLO DE NAVEGAÇÃO ENTRE ABAS
const Navegacao = {
    trocarAba(aba) {
        document.getElementById('abaFolha').style.display = aba === 'Folha' ? 'block' : 'none';
        document.getElementById('abaHistorico').style.display = aba === 'Historico' ? 'block' : 'none';
        document.getElementById('abaCurriculo').style.display = aba === 'Curriculo' ? 'block' : 'none';

        document.getElementById('btnAbaFolha').classList.toggle('active', aba === 'Folha');
        document.getElementById('btnAbaHistorico').classList.toggle('active', aba === 'Historico');
        document.getElementById('btnAbaCurriculo').classList.toggle('active', aba === 'Curriculo');

        if (aba === 'Historico') HistoricoController.carregar();
        if (aba === 'Curriculo') CurriculoController.carregar();
    }
};

// CONTROLO DA FOLHA DE PONTO
const FolhaPontoController = {
    gerarTabela() {
        const mesAnoVal = document.getElementById('mesAno').value;
        const corpo = document.getElementById('corpoTabelaPonto');
        corpo.innerHTML = '';

        if (!mesAnoVal) return;

        const [ano, mes] = mesAnoVal.split('-').map(Number);
        const totalDias = new Date(ano, mes, 0).getDate();

        for (let dia = 1; dia <= totalDias; dia++) {
            const dataObj = new Date(ano, mes - 1, dia);
            const diaSemanaIndex = dataObj.getDay();
            const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
            const rotulo = `${dia}/${diasSemana[diaSemanaIndex]}`;

            const tr = document.createElement('tr');
            tr.dataset.dia = dia;
            tr.dataset.fds = (diaSemanaIndex === 0 || diaSemanaIndex === 6) ? 'true' : 'false';

            tr.innerHTML = `
                <td><strong>${rotulo}</strong></td>
                <td>
                    <select onchange="FolhaPontoController.recalcularTotals()">
                        <option value="Trabalhado">Trabalhado</option>
                        <option value="Folga">Folga</option>
                        <option value="Falta">Falta</option>
                        <option value="Férias">Férias</option>
                        <option value="Baixa">Baixa</option>
                    </select>
                </td>
                <td><input type="time" class="ent1" onchange="FolhaPontoController.recalcularTotals()"></td>
                <td><input type="time" class="sai1" onchange="FolhaPontoController.recalcularTotals()"></td>
                <td><input type="time" class="ent2" onchange="FolhaPontoController.recalcularTotals()"></td>
                <td><input type="time" class="sai2" onchange="FolhaPontoController.recalcularTotals()"></td>
                <td class="total-dia">0h 00m</td>
            `;
            corpo.appendChild(tr);
        }
        this.recalcularTotals();
    },

    preencherPadrao() {
        const trs = document.querySelectorAll('#corpoTabelaPonto tr');
        const rEnt1 = document.getElementById('refEnt1').value;
        const rSai1 = document.getElementById('refSai1').value;
        const rEnt2 = document.getElementById('refEnt2').value;
        const rSai2 = document.getElementById('refSai2').value;

        const sEnt1 = document.getElementById('refSabEnt1').value;
        const sSai1 = document.getElementById('refSabSai1').value;

        trs.forEach(tr => {
            const rotulo = tr.querySelector('td').textContent;
            const selectStatus = tr.querySelector('select');

            if (rotulo.includes('dom')) {
                selectStatus.value = 'Folga';
            } else if (rotulo.includes('sáb')) {
                if (sEnt1 && sSai1) {
                    selectStatus.value = 'Trabalhado';
                    tr.querySelector('.ent1').value = sEnt1;
                    tr.querySelector('.sai1').value = sSai1;
                } else {
                    selectStatus.value = 'Folga';
                }
            } else {
                selectStatus.value = 'Trabalhado';
                tr.querySelector('.ent1').value = rEnt1;
                tr.querySelector('.sai1').value = rSai1;
                tr.querySelector('.ent2').value = rEnt2;
                tr.querySelector('.sai2').value = rSai2;
            }
        });
        this.recalcularTotals();
    },

    recalcularTotals() {
        const trs = document.querySelectorAll('#corpoTabelaPonto tr');
        let totalMinutosTrab = 0;
        let totalMinutosEsp = 0;
        let diasTrab = 0;

        trs.forEach(tr => {
            const status = tr.querySelector('select').value;
            const e1 = tr.querySelector('.ent1').value;
            const s1 = tr.querySelector('.sai1').value;
            const e2 = tr.querySelector('.ent2').value;
            const s2 = tr.querySelector('.sai2').value;

            let minDia = 0;
            if (status === 'Trabalhado') {
                minDia += Utils.calcularDiferencaMinutos(e1, s1);
                minDia += Utils.calcularDiferencaMinutos(e2, s2);
                if (minDia > 0) diasTrab++;
            }

            tr.querySelector('.total-dia').textContent = Utils.minutosParaTexto(minDia);
            totalMinutosTrab += minDia;

            const rotulo = tr.querySelector('td').textContent;
            if (!rotulo.includes('dom') && !rotulo.includes('sáb')) {
                totalMinutosEsp += 480; // 8h esperadas nos dias úteis
            }
        });

        const saldo = totalMinutosTrab - totalMinutosEsp;

        document.getElementById('dashTrabalhadas').textContent = Utils.minutosParaTexto(totalMinutosTrab);
        document.getElementById('dashEsperadas').textContent = Utils.minutosParaTexto(totalMinutosEsp);
        document.getElementById('dashSaldo').textContent = Utils.minutosParaTexto(saldo);
        document.getElementById('dashSaldo').className = saldo >= 0 ? 'txt-verde' : 'txt-vermelho';
        document.getElementById('dashDias').textContent = diasTrab;
    },

    salvar() {
        const colab = document.getElementById('nomeFuncionario').value.trim();
        const mesAno = document.getElementById('mesAno').value;
        if (!colab || !mesAno) return alert('Informe o nome do colaborador e o mês/ano.');

        const trs = document.querySelectorAll('#corpoTabelaPonto tr');
        const registros = [];

        trs.forEach(tr => {
            registros.push(new RegistroDiaModel(
                tr.querySelector('td').textContent,
                tr.querySelector('select').value,
                tr.querySelector('.ent1').value,
                tr.querySelector('.sai1').value,
                tr.querySelector('.ent2').value,
                tr.querySelector('.sai2').value
            ));
        });

        const folha = new FolhaPontoModel(colab, mesAno, registros);
        localStorage.setItem(`folha_${colab.toLowerCase().replace(/\s+/g, '_')}_${mesAno}`, JSON.stringify(folha));
        Utils.showToast('💾 Folha de Ponto guardada com sucesso!');
    },

    limpar() {
        const trs = document.querySelectorAll('#corpoTabelaPonto tr');
        trs.forEach(tr => {
            tr.querySelector('select').value = 'Trabalhado';
            tr.querySelectorAll('input').forEach(i => i.value = '');
            tr.querySelector('.total-dia').textContent = '0h 00m';
        });
        this.recalcularTotals();
    },

    exportarPDF() {
        const colab = document.getElementById('nomeFuncionario').value || 'Colaborador';
        const mes = document.getElementById('mesAno').value || 'Mes';
        const el = document.getElementById('abaFolha');

        const opt = {
            margin: 5,
            filename: `Folha_Ponto_${colab.replace(/\s+/g, '_')}_${mes}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(el).save();
    }
};

// CONTROLO DO HISTÓRICO
const HistoricoController = {
    carregar() {
        const container = document.getElementById('listaHistorico');
        container.innerHTML = '';
        let encontrou = false;

        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            if (chave.startsWith('folha_')) {
                encontrou = true;
                const folha = JSON.parse(localStorage.getItem(chave));
                const div = document.createElement('div');
                div.className = 'card';
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.alignItems = 'center';
                div.innerHTML = `
                    <div>
                        <strong>${folha.colaborador}</strong>
                        <div class="subtitle" style="margin:0;">Mês: ${folha.mesAno}</div>
                    </div>
                    <button class="btn btn-azul" onclick="HistoricoController.restaurar('${chave}')"><i class="fas fa-folder-open"></i> Abrir</button>
                `;
                container.appendChild(div);
            }
        }

        if (!encontrou) {
            container.innerHTML = '<p class="subtitle">Nenhuma folha guardada até ao momento.</p>';
        }
    },

    restaurar(chave) {
        const folha = JSON.parse(localStorage.getItem(chave));
        document.getElementById('nomeFuncionario').value = folha.colaborador;
        document.getElementById('mesAno').value = folha.mesAno;
        FolhaPontoController.gerarTabela();

        setTimeout(() => {
            const trs = document.querySelectorAll('#corpoTabelaPonto tr');
            folha.registros.forEach((reg, index) => {
                if (trs[index]) {
                    trs[index].querySelector('select').value = reg.status;
                    trs[index].querySelector('.ent1').value = reg.ent1;
                    trs[index].querySelector('.sai1').value = reg.sai1;
                    trs[index].querySelector('.ent2').value = reg.ent2;
                    trs[index].querySelector('.sai2').value = reg.sai2;
                }
            });
            FolhaPontoController.recalcularTotals();
            Navegacao.trocarAba('Folha');
            Utils.showToast('📂 Folha carregada!');
        }, 100);
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

    adicionarBlocoExperiencia(dados = {}) {
        const container = document.getElementById('containerExperiencias');
        const div = document.createElement('div');
        div.className = 'bloco-experiencia';
        div.innerHTML = `
            <button type="button" class="btn-rem-exp" onclick="this.parentElement.remove()"><i class="fas fa-times"></i> Remover</button>
            <div class="form-group" style="margin-bottom:8px;">
                <label>Cargo / Função</label>
                <input type="text" class="cv_exp_cargo" placeholder="Ex: Operador / Técnico" value="${dados.cargo || ''}">
            </div>
            <div class="form-group" style="margin-bottom:8px;">
                <label>Empresa / Organização</label>
                <input type="text" class="cv_exp_empresa" placeholder="Nome da empresa" value="${dados.empresa || ''}">
            </div>
            <div class="form-group">
                <label>Principais Responsabilidades</label>
                <textarea class="cv_exp_tarefas" placeholder="Descreva sucintamente as funções...">${dados.tarefas || ''}</textarea>
            </div>
        `;
        container.appendChild(div);
    },

    salvar(e) {
        e.preventDefault();
        const nome = document.getElementById('cv_nome').value.trim();
        if (!nome) return alert('Por favor, informe pelo menos o nome.');

        const blocos = document.querySelectorAll('.bloco-experiencia');
        const experiencias = [];
        blocos.forEach(b => {
            experiencias.push({
                cargo: b.querySelector('.cv_exp_cargo').value,
                empresa: b.querySelector('.cv_exp_empresa').value,
                tarefas: b.querySelector('.cv_exp_tarefas').value
            });
        });

        const dadosCv = new CurriculoModel(
            nome,
            document.getElementById('cv_nascimento').value,
            document.getElementById('cv_email').value,
            document.getElementById('cv_telefone').value,
            document.getElementById('cv_endereco').value,
            experiencias,
            document.getElementById('cv_escolaridade').value,
            document.getElementById('cv_instituicao').value,
            this.fotoBase64
        );

        // 1. Guardar no armazenamento local
        const chave = 'cv_' + nome.toLowerCase().replace(/\s+/g, '_');
        localStorage.setItem(chave, JSON.stringify(dadosCv));

        // 2. Descarregar ficheiro JSON (pergunta o local no dispositivo)
        const jsonStr = JSON.stringify(dadosCv, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `Curriculo_${nome.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.showToast('🎓 Currículo guardado com sucesso!');
    },

    exportarPDF() {
        const nome = document.getElementById('cv_nome').value.trim();
        if (!nome) {
            alert('Por favor, informe pelo menos o nome do colaborador antes de exportar o PDF.');
            return;
        }

        const elementoCV = document.querySelector('.europass-card');

        // Esconder botões temporariamente para não saírem na impressão
        const btnUpload = elementoCV.querySelector('.btn-upload-photo');
        const gridBotoes = elementoCV.querySelector('.grid-botoes');
        const btnsRemover = elementoCV.querySelectorAll('.btn-rem-exp');
        const btnAdd = elementoCV.querySelector('.btn-add-exp');

        if (btnUpload) btnUpload.style.display = 'none';
        if (gridBotoes) gridBotoes.style.display = 'none';
        if (btnAdd) btnAdd.style.display = 'none';
        btnsRemover.forEach(b => b.style.display = 'none');

        const opt = {
            margin: [5, 5, 5, 5],
            filename: `Curriculo_Europass_${nome.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(elementoCV).save().then(() => {
            if (btnUpload) btnUpload.style.display = '';
            if (gridBotoes) gridBotoes.style.display = 'grid';
            if (btnAdd) btnAdd.style.display = '';
            btnsRemover.forEach(b => b.style.display = '');
            Utils.showToast('📄 PDF do Currículo gerado com sucesso!');
        });
    },

    carregar() {
        const nome = document.getElementById('nomeFuncionario').value.trim();
        const container = document.getElementById('containerExperiencias');
        container.innerHTML = '';

        if (!nome) {
            this.adicionarBlocoExperiencia();
            return;
        }

        const raw = localStorage.getItem('cv_' + nome.toLowerCase().replace(/\s+/g, '_'));
        if (raw) {
            const cv = JSON.parse(raw);
            document.getElementById('cv_nome').value = cv.nome;
            document.getElementById('cv_nascimento').value = cv.dataNascimento;
            document.getElementById('cv_email').value = cv.email;
            document.getElementById('cv_telefone').value = cv.telefone;
            document.getElementById('cv_endereco').value = cv.endereco || '';
            document.getElementById('cv_escolaridade').value = cv.escolaridade;
            document.getElementById('cv_instituicao').value = cv.instituicao;

            if (cv.experiencias && cv.experiencias.length > 0) {
                cv.experiencias.forEach(exp => this.adicionarBlocoExperiencia(exp));
            } else {
                this.adicionarBlocoExperiencia();
            }

            if (cv.fotoBase64) {
                this.fotoBase64 = cv.fotoBase64;
                const img = document.getElementById('profile-img');
                img.src = cv.fotoBase64;
                img.style.display = 'block';
                document.getElementById('photo-text').style.display = 'none';
            }
            this.sincronizarNome(cv.nome);
        } else {
            this.adicionarBlocoExperiencia();
        }
    }
};

// INICIALIZAÇÃO DA APLICAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    document.getElementById('mesAno').value = `${ano}-${mes}`;

    FolhaPontoController.gerarTabela();
});
