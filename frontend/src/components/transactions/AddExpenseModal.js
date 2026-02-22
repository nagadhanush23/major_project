// frontend/src/components/AddExpenseModal.js
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Receipt, Camera } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectItem } from "../ui/select";
import { expenseAPI, aiAPI } from "../../services/api";
import { format } from "date-fns";
import './AddExpenseModal.css';

const CATEGORIES = [
    { value: "Food", label: "Food & Dining" },
    { value: "Transport", label: "Transport" },
    { value: "Shopping", label: "Shopping" },
    { value: "Entertainment", label: "Entertainment" },
    { value: "Bills", label: "Utilities" },
    { value: "Healthcare", label: "Health" },
    { value: "Travel", label: "Travel" },
    { value: "Education", label: "Education" },
    { value: "Other", label: "Other" },
];

const PAYMENT_METHODS = [
    { value: "credit_card", label: "Credit Card" },
    { value: "debit_card", label: "Debit Card" },
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "upi", label: "UPI" },
    { value: "other", label: "Other" },
];

export default function AddExpenseModal({ isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: "",
        amount: "",
        category: "",
        date: format(new Date(), "yyyy-MM-dd"),
        vendor: "",
        notes: "",
        payment_method: "credit_card",
        receipt_url: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleAIAssist = async () => {
        if (!formData.title) return;

        setIsAIProcessing(true);
        try {
            const response = await aiAPI.suggestExpenseDetails(formData.title, formData.notes);

            if (response.data.success) {
                setFormData((prev) => ({
                    ...prev,
                    category: response.data.category || prev.category,
                    vendor: response.data.vendor || prev.vendor,
                    title: response.data.title || prev.title,
                }));
            }
        } catch (error) {
            console.error("AI assist error:", error);
        } finally {
            setIsAIProcessing(false);
        }
    };

    const handleReceiptUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Upload the file
            const formDataUpload = new FormData();
            formDataUpload.append('receipt', file);

            const uploadResponse = await expenseAPI.uploadReceipt(formDataUpload);
            const fileUrl = uploadResponse.data.file_url;

            // Set receipt URL immediately so user sees it's uploaded
            setFormData((prev) => ({
                ...prev,
                receipt_url: fileUrl,
            }));

            // Extract data from receipt using AI
            setIsAIProcessing(true);
            try {
                // Use imageUrl for consistency, though backend now handles both
                const extractedResponse = await aiAPI.extractReceipt(fileUrl);

                if (extractedResponse.data && extractedResponse.data.success !== false) {
                    const extractedData = extractedResponse.data.data || extractedResponse.data;
                    setFormData((prev) => ({
                        ...prev,
                        vendor: extractedData.vendor || prev.vendor,
                        amount: extractedData.amount || prev.amount,
                        title: extractedData.title || prev.title,
                        category: extractedData.category || prev.category,
                        date: extractedData.date || prev.date,
                    }));
                }
            } catch (extractError) {
                console.warn("AI Extraction failed, but receipt was uploaded:", extractError);
                // Receipt is already saved in state, so we just continue
            }
        } catch (error) {
            console.error("Receipt upload error:", error);
            alert("Failed to upload receipt. Please try again.");
        } finally {
            setIsUploading(false);
            setIsAIProcessing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.amount || !formData.category) {
            alert("Please fill in title, amount, and category");
            return;
        }

        setIsLoading(true);
        try {
            const expenseData = {
                title: formData.title,
                amount: parseFloat(formData.amount),
                type: 'expense',
                category: formData.category,
                date: formData.date,
                vendor: formData.vendor,
                payment_method: formData.payment_method,
                receipt_url: formData.receipt_url,
                reference: formData.notes,
            };

            await onSave(expenseData);

            // Reset form
            setFormData({
                title: "",
                amount: "",
                category: "",
                date: format(new Date(), "yyyy-MM-dd"),
                vendor: "",
                notes: "",
                payment_method: "credit_card",
                receipt_url: "",
            });
            onClose();
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save expense. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="expense-modal-overlay"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="expense-modal"
                >
                    <div className="modal-header">
                        <div className="modal-header-content">
                            <h2 className="modal-title">Add Expense</h2>
                            <button onClick={onClose} className="modal-close-btn">
                                <X size={20} color="#6b7280" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-body">
                        {/* Receipt Upload */}
                        <div className="form-group">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleReceiptUpload}
                                accept="image/*"
                                style={{ display: "none" }}
                            />
                            <button
                                type="button"
                                className={`receipt-upload-btn ${formData.receipt_url ? 'has-receipt' : ''}`}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || isAIProcessing}
                            >
                                {isUploading || isAIProcessing ? (
                                    <>
                                        <Loader2 size={20} className="processing-spinner" color="#4f46e5" />
                                        <span style={{ color: '#6b7280' }}>Processing receipt...</span>
                                    </>
                                ) : formData.receipt_url ? (
                                    <>
                                        <Receipt size={20} color="#10b981" />
                                        <span style={{ color: '#10b981' }}>Receipt attached</span>
                                    </>
                                ) : (
                                    <>
                                        <Camera size={20} color="#6b7280" />
                                        <span style={{ color: '#6b7280' }}>Upload Receipt (AI)</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Title with AI Assist */}
                        <div className="form-group">
                            <Label htmlFor="title">Description</Label>
                            <div className="ai-assist-container">
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Coffee at Starbucks"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleAIAssist}
                                    disabled={!formData.title || isAIProcessing}
                                    className="ai-assist-btn"
                                >
                                    {isAIProcessing ? (
                                        <Loader2 size={16} className="processing-spinner" />
                                    ) : (
                                        <Sparkles size={16} color="#4f46e5" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Amount and Date */}
                        <div className="form-row">
                            <div className="form-group">
                                <Label htmlFor="amount">Amount</Label>
                                <div className="amount-input-wrapper">
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="form-group">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <option value="" disabled>Select category</option>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>

                        {/* Vendor */}
                        <div className="form-group">
                            <Label htmlFor="vendor">Vendor (optional)</Label>
                            <Input
                                id="vendor"
                                value={formData.vendor}
                                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                placeholder="Starbucks"
                            />
                        </div>

                        {/* Payment Method */}
                        <div className="form-group">
                            <Label htmlFor="payment_method">Payment Method</Label>
                            <Select
                                value={formData.payment_method}
                                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                            >
                                {PAYMENT_METHODS.map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                        {method.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>

                        {/* Notes */}
                        <div className="form-group">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any additional details..."
                                rows={2}
                            />
                        </div>

                        {/* Submit */}
                        <div className="form-actions">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || !formData.title || !formData.amount || !formData.category}
                            >
                                {isLoading ? (
                                    <Loader2 size={16} className="processing-spinner" />
                                ) : (
                                    "Add Expense"
                                )}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
