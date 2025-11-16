
import React, { useState, useMemo } from 'react';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { WaterDropIcon } from './icons/CareIcons';

const AgriculturalCalculators: React.FC = () => {
  // State for Fertilizer/Pesticide Calculator
  const [area, setArea] = useState<string>('1');
  const [areaUnit, setAreaUnit] = useState<'hectare' | 'm2'>('hectare');
  const [dose, setDose] = useState<string>('2');
  const [doseUnit, setDoseUnit] = useState<'kg_ha' | 'l_ha' | 'ml_100l'>('kg_ha');
  const [sprayVolume, setSprayVolume] = useState<string>('400'); // L/ha

  // State for Irrigation Calculator
  const [irrigationArea, setIrrigationArea] = useState<string>('1');
  const [irrigationAreaUnit, setIrrigationAreaUnit] = useState<'hectare' | 'm2'>('hectare');
  const [waterDepth, setWaterDepth] = useState<string>('25'); // mm

  const pesticideResult = useMemo(() => {
    const numArea = parseFloat(area);
    const numDose = parseFloat(dose);
    const numSprayVolume = parseFloat(sprayVolume);
    if (isNaN(numArea) || isNaN(numDose)) return null;

    const areaInHa = areaUnit === 'hectare' ? numArea : numArea / 10000;
    
    let totalProduct: number;
    let totalMix: number | null = null;

    if (doseUnit === 'kg_ha' || doseUnit === 'l_ha') {
      totalProduct = areaInHa * numDose;
      if (!isNaN(numSprayVolume) && numSprayVolume > 0) {
        totalMix = areaInHa * numSprayVolume;
      }
    } else { // ml_100l
      if (isNaN(numSprayVolume) || numSprayVolume <= 0) return null;
      totalMix = areaInHa * numSprayVolume;
      totalProduct = (totalMix / 100) * numDose; // in ml
    }

    return {
      totalProduct: totalProduct.toFixed(2),
      productUnit: doseUnit === 'kg_ha' ? 'کیلوگرم' : (doseUnit === 'l_ha' ? 'لیتر' : 'میلی‌لیتر'),
      totalMix: totalMix ? totalMix.toFixed(2) : null,
    };
  }, [area, areaUnit, dose, doseUnit, sprayVolume]);
  
  const irrigationResult = useMemo(() => {
      const numArea = parseFloat(irrigationArea);
      const numDepth = parseFloat(waterDepth);
      if (isNaN(numArea) || isNaN(numDepth)) return null;

      const areaInM2 = irrigationAreaUnit === 'm2' ? numArea : numArea * 10000;
      const depthInM = numDepth / 1000;
      
      const totalVolumeM3 = areaInM2 * depthInM;
      const totalVolumeLiters = totalVolumeM3 * 1000;
      
      return {
          liters: totalVolumeLiters.toLocaleString('fa-IR'),
          cubicMeters: totalVolumeM3.toLocaleString('fa-IR'),
      };

  }, [irrigationArea, irrigationAreaUnit, waterDepth]);

  const InputField: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string, type?: string}> = 
    ({label, value, onChange, placeholder, type = 'number'}) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            min="0"
            step="any"
        />
    </div>
  );

  const SelectField: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {value: string, label: string}[]}> = 
    ({label, value, onChange, options}) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">محاسبات کشاورزی</h1>
        <p className="mt-2 text-gray-600">
          ابزارهای کاربردی برای کمک به محاسبات روزمره در مزرعه و باغ.
        </p>
      </div>

      {/* Fertilizer/Pesticide Calculator */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-full">
                <CalculatorIcon className="w-6 h-6 text-green-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">محاسبه‌گر کود و سم</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="مساحت" value={area} onChange={e => setArea(e.target.value)} placeholder="مثال: 1.5"/>
            <SelectField label="واحد مساحت" value={areaUnit} onChange={e => setAreaUnit(e.target.value as any)} options={[{value: 'hectare', label: 'هکتار'}, {value: 'm2', label: 'متر مربع'}]}/>
            <InputField label="میزان مصرف (دوز)" value={dose} onChange={e => setDose(e.target.value)} placeholder="مثال: 2"/>
            <SelectField label="واحد میزان مصرف" value={doseUnit} onChange={e => setDoseUnit(e.target.value)} options={[
                {value: 'kg_ha', label: 'کیلوگرم در هکتار'}, 
                {value: 'l_ha', label: 'لیتر در هکتار'},
                {value: 'ml_100l', label: 'میلی‌لیتر در ۱۰۰ لیتر آب'}
            ]}/>
            <InputField label="حجم محلول‌پاشی (لیتر در هکتار)" value={sprayVolume} onChange={e => setSprayVolume(e.target.value)} placeholder="مثال: 400"/>
        </div>
        {pesticideResult && (
            <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                <h3 className="font-bold text-lg text-green-800">نتایج محاسبه:</h3>
                <p className="mt-2 text-green-700">
                    <span className="font-semibold">میزان کل ماده مورد نیاز:</span> {pesticideResult.totalProduct} {pesticideResult.productUnit}
                </p>
                {pesticideResult.totalMix && (
                    <p className="mt-1 text-green-700">
                        <span className="font-semibold">حجم کل محلول مورد نیاز:</span> {pesticideResult.totalMix} لیتر
                    </p>
                )}
            </div>
        )}
      </div>
      
      {/* Irrigation Calculator */}
       <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-full">
                <WaterDropIcon className="w-6 h-6 text-blue-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">محاسبه‌گر حجم آبیاری</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="مساحت" value={irrigationArea} onChange={e => setIrrigationArea(e.target.value)} placeholder="مثال: 0.5"/>
            <SelectField label="واحد مساحت" value={irrigationAreaUnit} onChange={e => setIrrigationAreaUnit(e.target.value as any)} options={[{value: 'hectare', label: 'هکتار'}, {value: 'm2', label: 'متر مربع'}]}/>
            <InputField label="عمق آب مورد نیاز (میلی‌متر)" value={waterDepth} onChange={e => setWaterDepth(e.target.value)} placeholder="مثال: 25"/>
        </div>
        {irrigationResult && (
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                 <h3 className="font-bold text-lg text-blue-800">نتایج محاسبه:</h3>
                <p className="mt-2 text-blue-700">
                    <span className="font-semibold">حجم کل آب مورد نیاز:</span> {irrigationResult.liters} لیتر (معادل {irrigationResult.cubicMeters} متر مکعب)
                </p>
            </div>
        )}
      </div>

    </div>
  );
};

export default AgriculturalCalculators;
