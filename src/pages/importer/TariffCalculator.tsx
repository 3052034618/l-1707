import React, { useState, useEffect } from 'react';
import { Calculator, History, Trash2, Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select, { type SelectOption } from '@/components/Select';
import Alert from '@/components/Alert';
import Table, { type TableColumn } from '@/components/Table';
import { OrderService } from '@/services';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const countryOptions: SelectOption[] = [
  { value: '中国', label: '中国' },
  { value: '美国', label: '美国' },
  { value: '德国', label: '德国' },
  { value: '日本', label: '日本' },
  { value: '韩国', label: '韩国' },
  { value: '澳大利亚', label: '澳大利亚' },
  { value: '新西兰', label: '新西兰' },
  { value: '新加坡', label: '新加坡' },
  { value: '马来西亚', label: '马来西亚' },
  { value: '泰国', label: '泰国' },
  { value: '越南', label: '越南' },
  { value: '印度尼西亚', label: '印度尼西亚' },
  { value: '菲律宾', label: '菲律宾' },
  { value: '英国', label: '英国' },
  { value: '法国', label: '法国' },
  { value: '意大利', label: '意大利' },
  { value: '西班牙', label: '西班牙' },
  { value: '加拿大', label: '加拿大' },
  { value: '巴西', label: '巴西' },
  { value: '印度', label: '印度' },
];

const currencyOptions: SelectOption[] = [
  { value: 'USD', label: 'USD 美元' },
  { value: 'CNY', label: 'CNY 人民币' },
  { value: 'EUR', label: 'EUR 欧元' },
  { value: 'JPY', label: 'JPY 日元' },
  { value: 'GBP', label: 'GBP 英镑' },
  { value: 'AUD', label: 'AUD 澳元' },
];

const hsCodeDatabase: Record<string, { name: string; description: string; category: string }> = {
  '84713000': {
    name: '便携式自动数据处理设备',
    description: '重量不超过10kg的便携式数字自动数据处理设备，至少由一个中央处理单元、一个键盘和一个显示器组成',
    category: '计算机及办公设备',
  },
  '85258013': {
    name: '智能手机',
    description: '具有移动通信功能的手持设备，具备上网、多媒体播放等功能',
    category: '通信设备',
  },
  '85423100': {
    name: '集成电路',
    description: '处理器及控制器，包括单片集成电路、混合集成电路',
    category: '电子元器件',
  },
  '84151021': {
    name: '空调机',
    description: '分体式空调，制冷量不超过4000大卡/小时',
    category: '家用电器',
  },
  '87032341': {
    name: '小轿车',
    description: '燃油型小轿车，排量1.5升至2.5升',
    category: '机动车辆',
  },
  '85171210': {
    name: '电话机',
    description: '有线电话机，包括可视电话机',
    category: '通信设备',
  },
  '84716090': {
    name: '计算机输入输出设备',
    description: '扫描仪、打印机等计算机外围设备',
    category: '计算机及办公设备',
  },
  '85287222': {
    name: '彩色液晶显示器',
    description: '彩色液晶监视器，对角线尺寸超过52厘米',
    category: '电子设备',
  },
};

interface TariffResult {
  hsCode: string;
  hsCodeInfo?: { name: string; description: string; category: string };
  originCountry: string;
  destinationCountry: string;
  amount: number;
  currency: string;
  normalRate: number;
  normalAmount: number;
  mfnRate: number;
  mfnAmount: number;
  preferentialRate?: number;
  preferentialAmount?: number;
  tradeAgreement?: string;
  vatRate: number;
  vatAmount: number;
  consumptionTaxRate: number;
  consumptionTaxAmount: number;
  totalTax: number;
  calculatedAt: string;
}

interface HistoryRecord extends TariffResult {
  id: string;
}

export default function TariffCalculator() {
  const [hsCode, setHsCode] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('中国');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [hsSuggestions, setHsSuggestions] = useState<{ code: string; name: string }[]>([]);
  const [showHsSuggestions, setShowHsSuggestions] = useState(false);
  const [result, setResult] = useState<TariffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'calculator' | 'history'>('calculator');

  useEffect(() => {
    if (hsCode && hsCode.length >= 2) {
      const filtered = Object.entries(hsCodeDatabase)
        .filter(([code, info]) =>
          code.includes(hsCode) || info.name.toLowerCase().includes(hsCode.toLowerCase())
        )
        .map(([code, info]) => ({ code, name: info.name }));
      setHsSuggestions(filtered);
      setShowHsSuggestions(filtered.length > 0);
    } else {
      setHsSuggestions([]);
      setShowHsSuggestions(false);
    }
  }, [hsCode]);

  const handleHsSelect = (code: string) => {
    setHsCode(code);
    setShowHsSuggestions(false);
  };

  const handleCalculate = async () => {
    if (!hsCode || !originCountry || !destinationCountry || !amount || Number(amount) <= 0) {
      return;
    }

    setLoading(true);
    try {
      const tariffInfo = await OrderService.calculateTariff(
        hsCode,
        originCountry,
        destinationCountry,
        Number(amount)
      );

      const normalRate = (tariffInfo.rate * 1.5) || 20;
      const normalAmount = Number((Number(amount) * normalRate / 100).toFixed(2));
      const mfnRate = tariffInfo.rate;
      const mfnAmount = tariffInfo.amount;
      const vatRate = 13;
      const vatAmount = Number(((Number(amount) + mfnAmount) * vatRate / 100).toFixed(2));
      const consumptionTaxRate = 0;
      const consumptionTaxAmount = 0;
      const totalTax = Number((mfnAmount + vatAmount + consumptionTaxAmount).toFixed(2));

      const hsCodeInfo = hsCodeDatabase[hsCode];

      const calcResult: TariffResult = {
        hsCode,
        hsCodeInfo,
        originCountry,
        destinationCountry,
        amount: Number(amount),
        currency,
        normalRate,
        normalAmount,
        mfnRate,
        mfnAmount,
        preferentialRate: tariffInfo.preferentialRate,
        preferentialAmount: tariffInfo.preferentialAmount,
        tradeAgreement: tariffInfo.tradeAgreement,
        vatRate,
        vatAmount,
        consumptionTaxRate,
        consumptionTaxAmount,
        totalTax,
        calculatedAt: new Date().toISOString(),
      };

      setResult(calcResult);

      const historyRecord: HistoryRecord = {
        ...calcResult,
        id: `calc_${Date.now()}`,
      };
      setHistory((prev) => [historyRecord, ...prev].slice(0, 20));
    } catch (error) {
      console.error('关税计算失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseHistory = (record: HistoryRecord) => {
    setHsCode(record.hsCode);
    setOriginCountry(record.originCountry);
    setDestinationCountry(record.destinationCountry);
    setAmount(record.amount.toString());
    setCurrency(record.currency);
    setResult(record);
    setActiveTab('calculator');
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const historyColumns: TableColumn<HistoryRecord>[] = [
    {
      title: 'HS编码',
      dataIndex: 'hsCode',
      key: 'hsCode',
      width: 120,
      render: (value) => <span className="font-mono text-gray-700">{value as string}</span>,
    },
    {
      title: '商品名称',
      dataIndex: 'hsCodeInfo',
      key: 'name',
      render: (value) => (
        <span className="text-gray-900">
          {(value as { name: string } | undefined)?.name || '-'}
        </span>
      ),
    },
    {
      title: '货值',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (value, record) => (
        <span className="text-gray-700">
          {record.currency} {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '税额',
      dataIndex: 'totalTax',
      key: 'totalTax',
      width: 140,
      render: (value, record) => (
        <span className="font-semibold text-red-600">
          {record.currency} {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '计算时间',
      dataIndex: 'calculatedAt',
      key: 'calculatedAt',
      width: 160,
      render: (value) => (
        <span className="text-gray-600">
          {format(new Date(value as string), 'yyyy-MM-dd HH:mm')}
        </span>
      ),
    },
    {
      title: '操作',
      dataIndex: 'id',
      key: 'actions',
      width: 140,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleUseHistory(record)}>
            使用
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-red-500" />}
            onClick={() => handleDeleteHistory(value as string)}
          />
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="关税计算器"
      subTitle="根据HS编码、原产国和货值快速计算进口关税、增值税等税费"
      breadcrumb={[
        { title: '进口商工作台' },
        { title: '工具中心' },
        { title: '关税计算器', active: true },
      ]}
    >
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={cn(
            'px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'calculator'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          )}
          onClick={() => setActiveTab('calculator')}
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            关税计算
          </div>
        </button>
        <button
          className={cn(
            'px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'history'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          )}
          onClick={() => setActiveTab('history')}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            历史记录
            {history.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                {history.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card title="计算参数">
              <Card.Body className="space-y-4">
                <div className="relative">
                  <Input
                    label="HS编码"
                    placeholder="请输入HS编码，如84713000"
                    icon={<Search className="w-4 h-4" />}
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    onFocus={() => hsCode && setShowHsSuggestions(hsSuggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowHsSuggestions(false), 200)}
                  />
                  {showHsSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {hsSuggestions.map((item) => (
                        <div
                          key={item.code}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleHsSelect(item.code)}
                        >
                          <div className="font-medium text-gray-900">{item.code}</div>
                          <div className="text-sm text-gray-500">{item.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Select
                  label="原产国"
                  placeholder="请选择原产国"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  options={countryOptions}
                />

                <Select
                  label="目的国"
                  placeholder="请选择目的国"
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value)}
                  options={countryOptions}
                />

                <Input
                  label="货值"
                  type="number"
                  placeholder="请输入货值金额"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />

                <Select
                  label="币种"
                  placeholder="请选择币种"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={currencyOptions}
                />

                <Button
                  variant="primary"
                  fullWidth
                  icon={<Calculator className="w-4 h-4" />}
                  loading={loading}
                  onClick={handleCalculate}
                  disabled={!hsCode || !originCountry || !destinationCountry || !amount}
                >
                  计算关税
                </Button>
              </Card.Body>
            </Card>

            {result?.hsCodeInfo && (
              <Card title="HS编码信息">
                <Card.Body className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">商品名称</div>
                    <div className="font-medium text-gray-900">{result.hsCodeInfo.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">商品类别</div>
                    <div className="text-gray-700">{result.hsCodeInfo.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">商品描述</div>
                    <div className="text-sm text-gray-600">{result.hsCodeInfo.description}</div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <>
                <Card title="税率对比">
                  <Card.Body>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-gray-50 rounded-lg border-2 border-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">普通税率</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-700">{result.normalRate}%</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {currency} {result.normalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700">最惠国税率</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-600">{result.mfnRate}%</div>
                        <div className="text-sm text-blue-500 mt-1">
                          {currency} {result.mfnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      {result.preferentialRate !== undefined ? (
                        <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-700">协定税率</span>
                          </div>
                          <div className="text-3xl font-bold text-green-600">{result.preferentialRate}%</div>
                          <div className="text-sm text-green-500 mt-1">
                            {currency} {result.preferentialAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-500">协定税率</span>
                          </div>
                          <div className="text-3xl font-bold text-gray-400">-</div>
                          <div className="text-sm text-gray-400 mt-1">暂无适用协定</div>
                        </div>
                      )}
                    </div>

                    {result.tradeAgreement && result.preferentialRate !== undefined && result.preferentialRate < result.mfnRate && (
                      <Alert
                        variant="success"
                        title="可享受优惠税率"
                        message={`根据${result.tradeAgreement}，您的货物可享受${result.preferentialRate}%的协定税率，相比最惠国税率节省 ${currency} ${(result.mfnAmount - (result.preferentialAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}。`}
                      />
                    )}

                    {!result.tradeAgreement && (
                      <Alert
                        variant="info"
                        title="自贸协定提示"
                        message="当前原产国与目的国之间暂无适用的自贸协定，将适用最惠国税率。"
                      />
                    )}
                  </Card.Body>
                </Card>

                <Card title="税费计算明细">
                  <Card.Body>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">税种</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border">税率</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border">计算基数 ({currency})</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border">税额 ({currency})</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 border font-medium">进口关税</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 border">{result.mfnRate}%</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 border">
                              {result.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 border font-medium">
                              {result.mfnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 border font-medium">进口增值税</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 border">{result.vatRate}%</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 border">
                              {(result.amount + result.mfnAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 border font-medium">
                              {result.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 border font-medium">消费税</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 border">{result.consumptionTaxRate}%</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 border">-</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 border font-medium">
                              {result.consumptionTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-900 border text-right">
                              税费合计
                            </td>
                            <td className="px-4 py-3 text-lg font-bold text-red-600 border text-right">
                              {result.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr className="bg-blue-50">
                            <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-900 border text-right">
                              预计总成本（货值+税费）
                            </td>
                            <td className="px-4 py-3 text-lg font-bold text-blue-600 border text-right">
                              {(result.amount + result.totalTax).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-yellow-800">重要提示</div>
                          <div className="text-sm text-yellow-700 mt-1">
                            以上计算结果仅供参考，实际税费以海关核定为准。进口增值税计算基数为完税价格加关税税额，消费税根据商品类别可能适用不同税率。
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </>
            ) : (
              <Card>
                <Card.Body className="flex flex-col items-center justify-center py-16">
                  <Calculator className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">开始计算关税</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    请在左侧输入HS编码、选择原产国和目的国，并填写货值金额，然后点击"计算关税"按钮获取详细的税费计算结果。
                  </p>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {history.length > 0 ? (
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleClearHistory}
              >
                清空历史
              </Button>
            </div>
          ) : null}

          {history.length > 0 ? (
            <Table
              columns={historyColumns}
              dataSource={history}
              rowKey="id"
              pagination={false}
            />
          ) : (
            <Card>
              <Card.Body className="flex flex-col items-center justify-center py-16">
                <History className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无计算记录</h3>
                <p className="text-gray-500 text-center max-w-md">
                  您使用关税计算器进行的计算会保存在这里，方便您随时查看和复用。
                </p>
                <Button variant="primary" className="mt-4" onClick={() => setActiveTab('calculator')}>
                  开始计算
                </Button>
              </Card.Body>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}
