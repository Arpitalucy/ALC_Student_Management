import React from 'react';
import { X, Download, GraduationCap } from 'lucide-react';
import { FeeRecordWithStudent } from '../types/fee';

interface FeeInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  feeRecord: FeeRecordWithStudent;
}

const FeeInvoice: React.FC<FeeInvoiceProps> = ({ isOpen, onClose, feeRecord }) => {
  const handleDownload = () => {
    window.print();
  };

  if (!isOpen) return null;

  const invoiceNumber = `INV-${feeRecord.id.slice(0, 8).toUpperCase()}`;
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header with close button - hidden in print */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 print:hidden">
            <h3 className="text-lg font-semibold text-gray-900">Fee Invoice</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-8 print:p-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Aveti Learning Center</h1>
                  <p className="text-gray-600">Excellence in Education</p>
                  <p className="text-sm text-gray-500 mt-1">
                    123 Education Street, Learning City, LC 12345<br />
                    Phone: +91 98765 43210 | Email: info@avetilearning.edu
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-900 mb-2">FEE INVOICE</h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Invoice #:</span> {invoiceNumber}</p>
                  <p><span className="font-medium">Date:</span> {currentDate}</p>
                  <p><span className="font-medium">Due Date:</span> {new Date(feeRecord.due_date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">{feeRecord.student_name}</p>
                  <p className="text-gray-600">Class: {feeRecord.student_class}</p>
                  <p className="text-gray-600">{feeRecord.student_email}</p>
                  <p className="text-gray-600 mt-2">
                    Student ID: {feeRecord.student_id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Details:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">
                    <span className="font-medium">Period:</span> {feeRecord.month_name} {feeRecord.year}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      feeRecord.status === 'paid' ? 'bg-green-100 text-green-800' :
                      feeRecord.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      feeRecord.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {feeRecord.status.charAt(0).toUpperCase() + feeRecord.status.slice(1)}
                    </span>
                  </p>
                  {feeRecord.paid_date && (
                    <p className="text-gray-600">
                      <span className="font-medium">Paid Date:</span> {new Date(feeRecord.paid_date).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Fee Details Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Details</h3>
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">Monthly Tuition Fee</div>
                        <div className="text-sm text-gray-500">Class: {feeRecord.student_class}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {feeRecord.month_name} {feeRecord.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ₹{feeRecord.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Section */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">₹{feeRecord.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Tax (0%):</span>
                    <span className="text-gray-900">₹0</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-lg font-bold text-blue-600">₹{feeRecord.amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Instructions</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-blue-900 mb-2">Bank Transfer Details:</p>
                    <p className="text-blue-800">Bank: State Bank of India</p>
                    <p className="text-blue-800">Account: 1234567890</p>
                    <p className="text-blue-800">IFSC: SBIN0001234</p>
                    <p className="text-blue-800">Account Name: Aveti Learning Center</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 mb-2">Other Payment Methods:</p>
                    <p className="text-blue-800">• Cash payment at school office</p>
                    <p className="text-blue-800">• UPI: avetilearning@paytm</p>
                    <p className="text-blue-800">• Cheque payable to "Aveti Learning Center"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Payment is due by the 15th of each month</p>
                <p>• Late payment charges of ₹100 will be applied after the due date</p>
                <p>• Please mention the invoice number when making payment</p>
                <p>• For any queries, contact our accounts department at accounts@avetilearning.edu</p>
                <p>• This is a computer-generated invoice and does not require a signature</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Thank you for choosing Aveti Learning Center for your educational journey!
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Generated on {currentDate} | Invoice #{invoiceNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default FeeInvoice;