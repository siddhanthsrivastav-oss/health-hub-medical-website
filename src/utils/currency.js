const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
})

export const formatINR = (value) => {
    const amount = Number(value)
    return inrFormatter.format(Number.isFinite(amount) ? amount : 0)
}
